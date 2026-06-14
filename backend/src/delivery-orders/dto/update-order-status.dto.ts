import { IsEnum } from 'class-validator';
import { DeliveryOrderStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
  @IsEnum(DeliveryOrderStatus)
  status: DeliveryOrderStatus;
}
