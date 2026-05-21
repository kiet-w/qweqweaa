import { OrderStatus } from '@prisma/client';

export class OrderItemResponseDto {
  id: number;
  productId: number;
  productName: string;
  productPrice: string;
  quantity: number;
  subtotal: string;
}

export class OrderResponseDto {
  id: number;
  status: OrderStatus;
  total: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItemResponseDto[];
}
