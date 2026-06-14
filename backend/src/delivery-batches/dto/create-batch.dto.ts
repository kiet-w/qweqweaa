import { IsInt, IsArray, ArrayMinSize } from 'class-validator';

export class CreateBatchDto {
  @IsInt()
  shipperId: number;

  @IsArray()
  @ArrayMinSize(2)
  @IsInt({ each: true })
  orderIds: number[];
}
