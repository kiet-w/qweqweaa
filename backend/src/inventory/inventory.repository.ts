import { Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Atomic stock change: upsert WarehouseStock + insert transaction log.
   * Uses Prisma interactive transaction to guarantee consistency.
   */
  async changeStock(params: {
    warehouseId: number;
    productId: number;
    quantity: number; // positive = in, negative = out
    type: TransactionType;
    reason?: string;
    referenceId?: string;
    createdById: number;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Get or create current stock record
      const stock = await tx.warehouseStock.upsert({
        where: {
          warehouseId_productId: {
            warehouseId: params.warehouseId,
            productId: params.productId,
          },
        },
        create: {
          warehouseId: params.warehouseId,
          productId: params.productId,
          quantity: 0,
        },
        update: {},
      });

      const balanceBefore = stock.quantity;
      const balanceAfter = balanceBefore + params.quantity;

      if (balanceAfter < 0) {
        throw new Error(
          `Tồn kho không đủ. Hiện có: ${balanceBefore}, yêu cầu xuất: ${Math.abs(params.quantity)}`,
        );
      }

      // 2. Update stock quantity
      await tx.warehouseStock.update({
        where: {
          warehouseId_productId: {
            warehouseId: params.warehouseId,
            productId: params.productId,
          },
        },
        data: { quantity: balanceAfter },
      });

      // 3. Insert transaction log
      const transaction = await tx.inventoryTransaction.create({
        data: {
          warehouseId: params.warehouseId,
          productId: params.productId,
          type: params.type,
          quantity: params.quantity,
          balanceBefore,
          balanceAfter,
          reason: params.reason,
          referenceId: params.referenceId,
          createdById: params.createdById,
        },
      });

      return { transaction, balanceBefore, balanceAfter };
    });
  }

  findStockByWarehouse(warehouseId: number) {
    return this.prisma.warehouseStock.findMany({
      where: { warehouseId },
      include: { product: true },
    });
  }

  findTransactions(params: {
    warehouseId?: number;
    productId?: number;
    type?: TransactionType;
    take?: number;
    skip?: number;
  }) {
    return this.prisma.inventoryTransaction.findMany({
      where: {
        warehouseId: params.warehouseId,
        productId: params.productId,
        type: params.type,
      },
      include: {
        product: true,
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: params.take ?? 50,
      skip: params.skip ?? 0,
    });
  }

  findStockByProduct(productId: number) {
    return this.prisma.warehouseStock.findMany({
      where: { productId },
      include: { warehouse: true },
    });
  }
}
