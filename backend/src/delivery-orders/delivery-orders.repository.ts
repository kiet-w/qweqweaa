import { Injectable } from '@nestjs/common';
import { DeliveryOrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeliveryOrderDto } from './dto/create-delivery-order.dto';

@Injectable()
export class DeliveryOrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    dto: CreateDeliveryOrderDto,
    createdById: number,
    lat?: number,
    lng?: number,
  ) {
    return this.prisma.deliveryOrder.create({
      data: {
        recipientName: dto.recipientName,
        recipientPhone: dto.recipientPhone,
        address: dto.address,
        lat,
        lng,
        warehouseId: dto.warehouseId,
        shipperId: dto.shipperId,
        notes: dto.notes,
        createdById,
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: { include: { product: true } }, warehouse: true },
    });
  }

  findAll(filters?: {
    status?: DeliveryOrderStatus;
    shipperId?: number;
    warehouseId?: number;
  }) {
    return this.prisma.deliveryOrder.findMany({
      where: {
        status: filters?.status,
        shipperId: filters?.shipperId,
        warehouseId: filters?.warehouseId,
      },
      include: {
        items: { include: { product: true } },
        warehouse: true,
        shipper: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: number) {
    return this.prisma.deliveryOrder.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        warehouse: true,
        shipper: { include: { user: { select: { name: true } } } },
      },
    });
  }

  findPendingByShipper(shipperId: number) {
    return this.prisma.deliveryOrder.findMany({
      where: {
        shipperId,
        status: {
          in: [DeliveryOrderStatus.ASSIGNED, DeliveryOrderStatus.PICKED_UP],
        },
      },
      include: { items: { include: { product: true } } },
    });
  }

  updateStatus(id: number, status: DeliveryOrderStatus) {
    return this.prisma.deliveryOrder.update({
      where: { id },
      data: { status },
    });
  }

  assignShipper(id: number, shipperId: number) {
    return this.prisma.deliveryOrder.update({
      where: { id },
      data: { shipperId, status: DeliveryOrderStatus.ASSIGNED },
    });
  }
}
