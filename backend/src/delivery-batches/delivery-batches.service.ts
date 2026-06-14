import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { BatchStatus, DeliveryOrderStatus, Prisma } from '@prisma/client';
import { DeliveryBatchesRepository } from './delivery-batches.repository';
import { DeliveryOrdersRepository } from '../delivery-orders/delivery-orders.repository';
import { MapboxService } from '../mapbox/mapbox.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { Coordinates } from '../mapbox/mapbox.types';

@Injectable()
export class DeliveryBatchesService {
  private readonly logger = new Logger(DeliveryBatchesService.name);

  constructor(
    private readonly repo: DeliveryBatchesRepository,
    private readonly ordersRepo: DeliveryOrdersRepository,
    private readonly mapbox: MapboxService,
  ) {}

  /**
   * Create a delivery batch (đơn ghép) and optimize the route.
   *
   * Flow:
   * 1. Validate all orders exist, are PENDING/ASSIGNED, and have lat/lng
   * 2. Create the batch
   * 3. Call Mapbox Optimization API to get optimal visit order
   * 4. Update batch with optimized route
   */
  async create(dto: CreateBatchDto) {
    // 1. Validate orders
    const orders = await Promise.all(
      dto.orderIds.map((id) => this.ordersRepo.findById(id)),
    );

    const validStatuses: DeliveryOrderStatus[] = [
      DeliveryOrderStatus.PENDING,
      DeliveryOrderStatus.ASSIGNED,
    ];
    for (const order of orders) {
      if (!order) throw new NotFoundException('Đơn hàng không tồn tại');
      if (!validStatuses.includes(order.status)) {
        throw new BadRequestException(
          `Đơn #${order.id} có trạng thái ${order.status}, không thể ghép`,
        );
      }
      if (!order.lat || !order.lng) {
        throw new BadRequestException(
          `Đơn #${order.id} chưa có tọa độ. Cần geocode trước.`,
        );
      }
    }

    // 2. Create batch
    const batch = await this.repo.create(dto.shipperId, dto.orderIds);

    // 3. Assign shipper to each order
    for (const orderId of dto.orderIds) {
      await this.ordersRepo.assignShipper(orderId, dto.shipperId);
    }

    // 4. Optimize route
    const optimizedBatch = await this.optimizeRoute(batch.id);

    return optimizedBatch;
  }

  /**
   * Call Mapbox Optimization API for an existing batch.
   * First waypoint = warehouse (start point), rest = delivery addresses.
   */
  async optimizeRoute(batchId: number) {
    const batch = await this.repo.findById(batchId);
    if (!batch) throw new NotFoundException('Batch không tồn tại');

    // Build waypoints: [warehouse, order1, order2, ...]
    const warehouse = batch.orders[0]?.order.warehouse;
    if (!warehouse?.lat || !warehouse?.lng) {
      throw new BadRequestException('Kho chưa có tọa độ');
    }

    const waypoints: Coordinates[] = [
      { lat: warehouse.lat, lng: warehouse.lng },
    ];

    const batchOrderMap: { batchOrderId: number; originalIndex: number }[] = [];
    for (const bo of batch.orders) {
      if (bo.order.lat && bo.order.lng) {
        batchOrderMap.push({
          batchOrderId: bo.id,
          originalIndex: waypoints.length,
        });
        waypoints.push({ lat: bo.order.lat, lng: bo.order.lng });
      }
    }

    if (waypoints.length < 2) {
      throw new BadRequestException('Không đủ điểm giao có tọa độ để tối ưu');
    }

    // Call Mapbox
    const result = await this.mapbox.optimizeRoute(waypoints, true);
    if (!result) {
      throw new BadRequestException('Mapbox Optimization API lỗi');
    }

    // Map optimized order back to batch orders
    const waypointOrder = batchOrderMap.map((bom) => {
      const optimizedWp = result.waypoints.find(
        (w) => w.waypointIndex === bom.originalIndex,
      );
      return {
        batchOrderId: bom.batchOrderId,
        sequenceOrder: optimizedWp?.tripsIndex ?? bom.originalIndex,
      };
    });

    const updated = await this.repo.updateOptimizedRoute(
      batchId,
      result as unknown as Prisma.InputJsonValue,
      result.totalDistanceM,
      result.totalDurationS,
      waypointOrder,
    );

    this.logger.log(
      `Batch #${batchId} optimized: ${result.totalDistanceM}m, ${result.totalDurationS}s`,
    );

    return updated;
  }

  findAll(shipperId?: number) {
    return this.repo.findAll(shipperId);
  }

  async findById(id: number) {
    const batch = await this.repo.findById(id);
    if (!batch) throw new NotFoundException('Batch không tồn tại');
    return batch;
  }

  async startBatch(id: number) {
    const batch = await this.findById(id);
    if (batch.status !== BatchStatus.OPTIMIZED) {
      throw new BadRequestException('Batch chưa được tối ưu tuyến');
    }
    return this.repo.updateStatus(id, BatchStatus.IN_PROGRESS);
  }

  async completeBatch(id: number) {
    return this.repo.updateStatus(id, BatchStatus.COMPLETED);
  }
}
