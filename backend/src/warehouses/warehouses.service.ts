import { Injectable, NotFoundException } from '@nestjs/common';
import { WarehousesRepository } from './warehouses.repository';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

@Injectable()
export class WarehousesService {
  constructor(private readonly repo: WarehousesRepository) {}

  create(dto: CreateWarehouseDto) {
    return this.repo.create(dto);
  }

  findAll() {
    return this.repo.findAll();
  }

  async findById(id: number) {
    const warehouse = await this.repo.findById(id);
    if (!warehouse) throw new NotFoundException('Kho không tồn tại');
    return warehouse;
  }

  async update(id: number, dto: UpdateWarehouseDto) {
    await this.findById(id);
    return this.repo.update(id, dto);
  }

  async remove(id: number) {
    await this.findById(id);
    return this.repo.softDelete(id);
  }
}
