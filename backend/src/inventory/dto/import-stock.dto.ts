import { IsInt, IsString, IsOptional, Min } from 'class-validator';

export class ImportStockDto {
  @IsInt()
  warehouseId: number;

  @IsInt()
  productId: number;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  referenceId?: string; // PO number, etc.
}
