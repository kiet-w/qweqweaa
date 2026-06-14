import { Module } from '@nestjs/common';
import { ShippersController } from './shippers.controller';
import { ShippersService } from './shippers.service';
import { ShippersRepository } from './shippers.repository';

@Module({
  controllers: [ShippersController],
  providers: [ShippersService, ShippersRepository],
  exports: [ShippersService, ShippersRepository],
})
export class ShippersModule {}
