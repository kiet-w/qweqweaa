import { Injectable } from '@nestjs/common';
import { BatchStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DeliveryBatchesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(shipperId: number, orderIds: number[]) {
    return this.prisma.deliveryBatch.create({
      data: {
        shipperId,
        orders: {
          create: orderIds.map((orderId, index) => ({
            orderId,
            sequenceOrder: index + 1,
          })),
        },
      },
      include: {
        orders: {
          include: {
            order: {
              include: {
                items: { include: { product: true } },
                warehouse: true,
              },
            },
          },
          orderBy: { sequenceOrder: 'asc' },
        },
        shipper: { include: { user: { select: { name: true } } } },
      },
    });
  }

  findById(id: number) {
    return this.prisma.deliveryBatch.findUnique({
      where: { id },
      include: {
        orders: {
          include: {
            order: {
              include: {
                items: { include: { product: true } },
                warehouse: true,
              },
            },
          },
          orderBy: { sequenceOrder: 'asc' },
        },
        shipper: { include: { user: { select: { name: true } } } },
      },
    });
  }

  findAll(shipperId?: number) {
    return this.prisma.deliveryBatch.findMany({
      where: shipperId ? { shipperId } : {},
      include: {
        orders: {
          include: { order: true },
          orderBy: { sequenceOrder: 'asc' },
        },
        shipper: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateOptimizedRoute(
    batchId: number,
    route: Prisma.InputJsonValue,
    totalDistanceM: number,
    estimatedDurationS: number,
    waypointOrder: { batchOrderId: number; sequenceOrder: number }[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.deliveryBatch.update({
        where: { id: batchId },
        data: {
          optimizedRoute: route,
          totalDistanceM: totalDistanceM,
          estimatedDurationS: estimatedDurationS,
          status: BatchStatus.OPTIMIZED,
        },
      });

      for (const wp of waypointOrder) {
        await tx.deliveryBatchOrder.update({
          where: { id: wp.batchOrderId },
          data: { sequenceOrder: wp.sequenceOrder },
        });
      }

      return tx.deliveryBatch.findUnique({
        where: { id: batchId },
        include: {
          orders: {
            include: { order: true },
            orderBy: { sequenceOrder: 'asc' },
          },
        },
      });
    });
  }

  updateStatus(id: number, status: BatchStatus) {
    return this.prisma.deliveryBatch.update({
      where: { id },
      data: {
        status,
        ...(status === BatchStatus.IN_PROGRESS
          ? { startedAt: new Date() }
          : {}),
        ...(status === BatchStatus.COMPLETED
          ? { completedAt: new Date() }
          : {}),
      },
    });
  }
}
