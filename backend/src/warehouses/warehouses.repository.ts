import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

@Injectable()
export class WarehousesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateWarehouseDto) {
    return this.prisma.warehouse.create({ data: dto });
  }

  findAll() {
    return this.prisma.warehouse.findMany({
      where: { isActive: true },
      include: { stocks: { include: { product: true } } },
    });
  }

  findById(id: number) {
    return this.prisma.warehouse.findUnique({
      where: { id },
      include: { stocks: { include: { product: true } } },
    });
  }

  update(id: number, dto: UpdateWarehouseDto) {
    return this.prisma.warehouse.update({ where: { id }, data: dto });
  }

  softDelete(id: number) {
    return this.prisma.warehouse.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
