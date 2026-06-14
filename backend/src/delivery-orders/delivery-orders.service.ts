import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DeliveryOrderStatus } from '@prisma/client';
import { DeliveryOrdersRepository } from './delivery-orders.repository';
import { InventoryService } from '../inventory/inventory.service';
import { MapboxService } from '../mapbox/mapbox.service';
import { CreateDeliveryOrderDto } from './dto/create-delivery-order.dto';

@Injectable()
export class DeliveryOrdersService {
  private readonly logger = new Logger(DeliveryOrdersService.name);

  constructor(
    private readonly repo: DeliveryOrdersRepository,
    private readonly inventory: InventoryService,
    private readonly mapbox: MapboxService,
  ) {}

  async create(dto: CreateDeliveryOrderDto, userId: number) {
    // 1. Geocode address → lat/lng
    let lat: number | undefined;
    let lng: number | undefined;
    try {
      const coords = await this.mapbox.geocode(dto.address);
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
      }
    } catch (error) {
      this.logger.warn(`Geocode failed for "${dto.address}": ${error}`);
      // Non-blocking — order still created without coordinates
    }

    // 2. Deduct stock for each item
    for (const item of dto.items) {
      await this.inventory.exportStock({
        warehouseId: dto.warehouseId,
        productId: item.productId,
        quantity: item.quantity,
        referenceId: `pending-${Date.now()}`,
        userId,
      });
    }

    // 3. Create order
    const order = await this.repo.create(dto, userId, lat, lng);

    this.logger.log(
      `Order #${order.id} created with ${dto.items.length} items`,
    );
    return order;
  }

  findAll(filters?: {
    status?: DeliveryOrderStatus;
    shipperId?: number;
    warehouseId?: number;
  }) {
    return this.repo.findAll(filters);
  }

  async findById(id: number) {
    const order = await this.repo.findById(id);
    if (!order) throw new NotFoundException('Đơn hàng không tồn tại');
    return order;
  }

  async updateStatus(id: number, status: DeliveryOrderStatus) {
    const order = await this.findById(id);

    const validTransitions: Record<DeliveryOrderStatus, DeliveryOrderStatus[]> =
      {
        PENDING: [DeliveryOrderStatus.ASSIGNED, DeliveryOrderStatus.CANCELLED],
        ASSIGNED: [
          DeliveryOrderStatus.PICKED_UP,
          DeliveryOrderStatus.CANCELLED,
        ],
        PICKED_UP: [DeliveryOrderStatus.IN_TRANSIT],
        IN_TRANSIT: [DeliveryOrderStatus.DELIVERED, DeliveryOrderStatus.FAILED],
        DELIVERED: [],
        FAILED: [DeliveryOrderStatus.PENDING],
        CANCELLED: [],
      };

    if (!validTransitions[order.status].includes(status)) {
      throw new BadRequestException(
        `Không thể chuyển trạng thái từ ${order.status} sang ${status}`,
      );
    }

    return this.repo.updateStatus(id, status);
  }

  async assignShipper(orderId: number, shipperId: number) {
    const order = await this.findById(orderId);
    if (order.status !== DeliveryOrderStatus.PENDING) {
      throw new BadRequestException('Chỉ có thể gán shipper cho đơn PENDING');
    }
    return this.repo.assignShipper(orderId, shipperId);
  }

  findPendingByShipper(shipperId: number) {
    return this.repo.findPendingByShipper(shipperId);
  }
}
