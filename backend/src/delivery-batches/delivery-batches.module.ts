import { Module } from '@nestjs/common';
import { DeliveryBatchesController } from './delivery-batches.controller';
import { DeliveryBatchesService } from './delivery-batches.service';
import { DeliveryBatchesRepository } from './delivery-batches.repository';
import { DeliveryOrdersModule } from '../delivery-orders/delivery-orders.module';
import { MapboxModule } from '../mapbox/mapbox.module';

@Module({
  imports: [DeliveryOrdersModule, MapboxModule],
  controllers: [DeliveryBatchesController],
  providers: [DeliveryBatchesService, DeliveryBatchesRepository],
  exports: [DeliveryBatchesService],
})
export class DeliveryBatchesModule {}
