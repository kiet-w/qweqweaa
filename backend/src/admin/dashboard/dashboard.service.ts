import { Injectable } from '@nestjs/common';
import { DeliveryOrderStatus, BatchStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const [
      totalOrders,
      pendingOrders,
      inTransitOrders,
      deliveredOrders,
      totalBatches,
      activeBatches,
      totalProducts,
      totalShippers,
    ] = await Promise.all([
      this.prisma.deliveryOrder.count(),
      this.prisma.deliveryOrder.count({
        where: { status: DeliveryOrderStatus.PENDING },
      }),
      this.prisma.deliveryOrder.count({
        where: { status: DeliveryOrderStatus.IN_TRANSIT },
      }),
      this.prisma.deliveryOrder.count({
        where: { status: DeliveryOrderStatus.DELIVERED },
      }),
      this.prisma.deliveryBatch.count(),
      this.prisma.deliveryBatch.count({
        where: { status: BatchStatus.IN_PROGRESS },
      }),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.shipper.count({ where: { isAvailable: true } }),
    ]);

    return {
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        inTransit: inTransitOrders,
        delivered: deliveredOrders,
      },
      batches: { total: totalBatches, active: activeBatches },
      products: { total: totalProducts },
      shippers: { available: totalShippers },
    };
  }

  async getTodaySummary() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [ordersToday, deliveredToday, batchesToday] = await Promise.all([
      this.prisma.deliveryOrder.count({
        where: { createdAt: { gte: startOfDay } },
      }),
      this.prisma.deliveryOrder.count({
        where: {
          status: DeliveryOrderStatus.DELIVERED,
          updatedAt: { gte: startOfDay },
        },
      }),
      this.prisma.deliveryBatch.count({
        where: { createdAt: { gte: startOfDay } },
      }),
    ]);

    return { ordersToday, deliveredToday, batchesToday };
  }
}
