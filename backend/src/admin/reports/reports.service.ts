import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Báo cáo bù trừ kho: so sánh số lượng nhập vs xuất cho mỗi sản phẩm.
   * Trả về: tổng nhập, tổng xuất, tổng điều chỉnh, tồn hiện tại, chênh lệch.
   */
  async getInventoryReconciliation(warehouseId: number) {
    const stocks = await this.prisma.warehouseStock.findMany({
      where: { warehouseId },
      include: { product: true },
    });

    const results = await Promise.all(
      stocks.map(async (stock) => {
        const transactions = await this.prisma.inventoryTransaction.groupBy({
          by: ['type'],
          where: { warehouseId, productId: stock.productId },
          _sum: { quantity: true },
        });

        const totalImport =
          transactions.find((t) => t.type === 'IMPORT')?._sum.quantity ?? 0;
        const totalExport = Math.abs(
          transactions.find((t) => t.type === 'EXPORT')?._sum.quantity ?? 0,
        );
        const totalAdjustment =
          transactions.find((t) => t.type === 'ADJUSTMENT')?._sum.quantity ?? 0;
        const totalReturn =
          transactions.find((t) => t.type === 'RETURN')?._sum.quantity ?? 0;

        const expectedBalance =
          totalImport - totalExport + totalAdjustment + totalReturn;
        const discrepancy = stock.quantity - expectedBalance;

        return {
          productId: stock.productId,
          productName: stock.product.name,
          sku: stock.product.sku,
          currentStock: stock.quantity,
          totalImport,
          totalExport,
          totalAdjustment,
          totalReturn,
          expectedBalance,
          discrepancy,
        };
      }),
    );

    return results;
  }

  /** Báo cáo hiệu suất shipper */
  async getShipperPerformance(startDate?: Date, endDate?: Date) {
    const where = {
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {}),
            },
          }
        : {}),
    };

    const shippers = await this.prisma.shipper.findMany({
      include: {
        user: { select: { name: true } },
        deliveryBatches: {
          where,
          select: {
            id: true,
            status: true,
            totalDistanceM: true,
            estimatedDurationS: true,
            orders: { select: { id: true } },
          },
        },
      },
    });

    return shippers.map((s) => ({
      shipperId: s.id,
      name: s.user.name,
      totalBatches: s.deliveryBatches.length,
      totalOrders: s.deliveryBatches.reduce(
        (sum, b) => sum + b.orders.length,
        0,
      ),
      completedBatches: s.deliveryBatches.filter(
        (b) => b.status === 'COMPLETED',
      ).length,
      totalDistanceKm: +(
        s.deliveryBatches.reduce((sum, b) => sum + (b.totalDistanceM ?? 0), 0) /
        1000
      ).toFixed(1),
    }));
  }
}
