import { IsInt, IsString } from 'class-validator';

export class AdjustStockDto {
  @IsInt()
  warehouseId: number;

  @IsInt()
  productId: number;

  @IsInt()
  quantity: number; // Positive = add, negative = subtract

  @IsString()
  reason: string; // Bắt buộc khi điều chỉnh thủ công
}
