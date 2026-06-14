import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShipperDto } from './dto/create-shipper.dto';
import { UpdateShipperDto } from './dto/update-shipper.dto';

@Injectable()
export class ShippersRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateShipperDto) {
    return this.prisma.shipper.create({
      data: dto,
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  findAll() {
    return this.prisma.shipper.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  findById(id: number) {
    return this.prisma.shipper.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  findAvailable() {
    return this.prisma.shipper.findMany({
      where: { isAvailable: true },
      include: { user: { select: { id: true, name: true } } },
    });
  }

  update(id: number, dto: UpdateShipperDto) {
    return this.prisma.shipper.update({ where: { id }, data: dto });
  }
}
