import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { ReportsService } from './reports.service';

@Controller('admin/reports')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER)
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('inventory/:warehouseId')
  getInventoryReconciliation(@Param('warehouseId', ParseIntPipe) id: number) {
    return this.service.getInventoryReconciliation(id);
  }

  @Get('shippers')
  getShipperPerformance(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.getShipperPerformance(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}
