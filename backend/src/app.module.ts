import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { InventoryModule } from './inventory/inventory.module';
import { ShippersModule } from './shippers/shippers.module';
import { MapboxModule } from './mapbox/mapbox.module';
import { DeliveryOrdersModule } from './delivery-orders/delivery-orders.module';
import { DeliveryBatchesModule } from './delivery-batches/delivery-batches.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ProductsModule,
    WarehousesModule,
    InventoryModule,
    ShippersModule,
    MapboxModule,
    DeliveryOrdersModule,
    DeliveryBatchesModule,
    AdminModule,
  ],
})
export class AppModule {}
