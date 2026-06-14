import { Injectable, NotFoundException } from '@nestjs/common';
import { ShippersRepository } from './shippers.repository';
import { CreateShipperDto } from './dto/create-shipper.dto';
import { UpdateShipperDto } from './dto/update-shipper.dto';

@Injectable()
export class ShippersService {
  constructor(private readonly repo: ShippersRepository) {}

  create(dto: CreateShipperDto) {
    return this.repo.create(dto);
  }

  findAll() {
    return this.repo.findAll();
  }

  async findById(id: number) {
    const shipper = await this.repo.findById(id);
    if (!shipper) throw new NotFoundException('Shipper không tồn tại');
    return shipper;
  }

  findAvailable() {
    return this.repo.findAvailable();
  }

  async update(id: number, dto: UpdateShipperDto) {
    await this.findById(id);
    return this.repo.update(id, dto);
  }
}
