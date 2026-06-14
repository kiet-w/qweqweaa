import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { InventoryRepository } from './inventory.repository';
import { ImportStockDto } from './dto/import-stock.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly repo: InventoryRepository) {}

  /** Nhập kho từ tổng kho */
  async importStock(dto: ImportStockDto, userId: number) {
    const result = await this.repo.changeStock({
      warehouseId: dto.warehouseId,
      productId: dto.productId,
      quantity: dto.quantity,
      type: TransactionType.IMPORT,
      reason: dto.reason ?? 'Nhập kho từ tổng kho',
      referenceId: dto.referenceId,
      createdById: userId,
    });

    this.logger.log(
      `IMPORT: product=${dto.productId} warehouse=${dto.warehouseId} qty=${dto.quantity} ` +
        `balance: ${result.balanceBefore} → ${result.balanceAfter}`,
    );

    return result;
  }

  /** Xuất kho (gọi từ delivery order service) */
  async exportStock(params: {
    warehouseId: number;
    productId: number;
    quantity: number;
    referenceId: string;
    userId: number;
  }) {
    try {
      return await this.repo.changeStock({
        warehouseId: params.warehouseId,
        productId: params.productId,
        quantity: -params.quantity,
        type: TransactionType.EXPORT,
        reason: `Xuất kho cho đơn giao #${params.referenceId}`,
        referenceId: params.referenceId,
        createdById: params.userId,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('Tồn kho không đủ')
      ) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /** Điều chỉnh thủ công (kiểm kê) */
  async adjustStock(dto: AdjustStockDto, userId: number) {
    try {
      return await this.repo.changeStock({
        warehouseId: dto.warehouseId,
        productId: dto.productId,
        quantity: dto.quantity,
        type: TransactionType.ADJUSTMENT,
        reason: dto.reason,
        createdById: userId,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('Tồn kho không đủ')
      ) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  getStockByWarehouse(warehouseId: number) {
    return this.repo.findStockByWarehouse(warehouseId);
  }

  getStockByProduct(productId: number) {
    return this.repo.findStockByProduct(productId);
  }

  getTransactions(params: {
    warehouseId?: number;
    productId?: number;
    type?: TransactionType;
    take?: number;
    skip?: number;
  }) {
    return this.repo.findTransactions(params);
  }
}
