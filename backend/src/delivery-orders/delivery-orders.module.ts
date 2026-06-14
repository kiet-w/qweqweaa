import { Module } from '@nestjs/common';
import { DeliveryOrdersController } from './delivery-orders.controller';
import { DeliveryOrdersService } from './delivery-orders.service';
import { DeliveryOrdersRepository } from './delivery-orders.repository';
import { InventoryModule } from '../inventory/inventory.module';
import { MapboxModule } from '../mapbox/mapbox.module';

@Module({
  imports: [InventoryModule, MapboxModule],
  controllers: [DeliveryOrdersController],
  providers: [DeliveryOrdersService, DeliveryOrdersRepository],
  exports: [DeliveryOrdersService, DeliveryOrdersRepository],
})
export class DeliveryOrdersModule {}
