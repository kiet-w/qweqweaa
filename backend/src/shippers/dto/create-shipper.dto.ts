import { IsInt, IsString, IsOptional } from 'class-validator';

export class CreateShipperDto {
  @IsInt()
  userId: number;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  vehicleType?: string;
}
