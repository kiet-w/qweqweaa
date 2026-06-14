import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateShipperDto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  vehicleType?: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
