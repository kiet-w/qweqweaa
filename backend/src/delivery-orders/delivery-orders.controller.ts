import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DeliveryOrderStatus, UserRole } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { DeliveryOrdersService } from './delivery-orders.service';
import { CreateDeliveryOrderDto } from './dto/create-delivery-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

interface RequestWithUser {
  user: {
    sub: number;
    role: string;
  };
}

@Controller('delivery-orders')
@UseGuards(AuthGuard, RolesGuard)
export class DeliveryOrdersController {
  constructor(private readonly service: DeliveryOrdersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER)
  create(@Body() dto: CreateDeliveryOrderDto, @Req() req: RequestWithUser) {
    return this.service.create(dto, req.user.sub);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER)
  findAll(
    @Query('status') status?: DeliveryOrderStatus,
    @Query('shipperId') shipperId?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.service.findAll({
      status,
      shipperId: shipperId ? +shipperId : undefined,
      warehouseId: warehouseId ? +warehouseId : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.service.updateStatus(id, dto.status);
  }

  @Patch(':id/assign/:shipperId')
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER)
  assignShipper(
    @Param('id', ParseIntPipe) id: number,
    @Param('shipperId', ParseIntPipe) shipperId: number,
  ) {
    return this.service.assignShipper(id, shipperId);
  }
}
