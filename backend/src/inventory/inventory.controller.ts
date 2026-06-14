import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TransactionType, UserRole } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { InventoryService } from './inventory.service';
import { ImportStockDto } from './dto/import-stock.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';

interface RequestWithUser {
  user: {
    sub: number;
    role: string;
  };
}

@Controller('inventory')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER)
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Post('import')
  importStock(@Body() dto: ImportStockDto, @Req() req: RequestWithUser) {
    return this.service.importStock(dto, req.user.sub);
  }

  @Post('adjust')
  adjustStock(@Body() dto: AdjustStockDto, @Req() req: RequestWithUser) {
    return this.service.adjustStock(dto, req.user.sub);
  }

  @Get('warehouse/:warehouseId')
  getStockByWarehouse(@Param('warehouseId', ParseIntPipe) id: number) {
    return this.service.getStockByWarehouse(id);
  }

  @Get('product/:productId')
  getStockByProduct(@Param('productId', ParseIntPipe) id: number) {
    return this.service.getStockByProduct(id);
  }

  @Get('transactions')
  getTransactions(
    @Query('warehouseId') warehouseId?: string,
    @Query('productId') productId?: string,
    @Query('type') type?: TransactionType,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    return this.service.getTransactions({
      warehouseId: warehouseId ? +warehouseId : undefined,
      productId: productId ? +productId : undefined,
      type,
      take: take ? +take : undefined,
      skip: skip ? +skip : undefined,
    });
  }
}
