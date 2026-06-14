import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { DeliveryBatchesService } from './delivery-batches.service';
import { CreateBatchDto } from './dto/create-batch.dto';

@Controller('delivery-batches')
@UseGuards(AuthGuard, RolesGuard)
export class DeliveryBatchesController {
  constructor(private readonly service: DeliveryBatchesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER)
  create(@Body() dto: CreateBatchDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('shipperId') shipperId?: string) {
    return this.service.findAll(shipperId ? +shipperId : undefined);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }

  @Patch(':id/optimize')
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER)
  reOptimize(@Param('id', ParseIntPipe) id: number) {
    return this.service.optimizeRoute(id);
  }

  @Patch(':id/start')
  startBatch(@Param('id', ParseIntPipe) id: number) {
    return this.service.startBatch(id);
  }

  @Patch(':id/complete')
  completeBatch(@Param('id', ParseIntPipe) id: number) {
    return this.service.completeBatch(id);
  }
}
