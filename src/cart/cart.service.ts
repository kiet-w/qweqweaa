import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CartStatus, Prisma, ProductStatus } from '@prisma/client';
import { CACHE_KEYS, CACHE_TTL } from '../common/constants/cache.constants';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartResponseDto } from './dto/cart-response.dto';

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async getCart(userId: number): Promise<CartResponseDto> {
    return this.redisService.getOrSet(
      CACHE_KEYS.CART(userId),
      async () => {
        const cart = await this.getCartWithItems(userId);
        return this.serializeCart(cart);
      },
      CACHE_TTL.CART,
    );
  }

  async addItem(userId: number, dto: AddCartItemDto): Promise<CartResponseDto> {
    const product = await this.validateProductAvailability(
      dto.productId,
      dto.quantity,
    );
    const cart = await this.getOrCreateActiveCart(userId);
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: dto.productId,
        },
      },
    });

    if (existingItem) {
      const finalQuantity = existingItem.quantity + dto.quantity;
      if (finalQuantity > product.stock) {
        throw new BadRequestException('Sản phẩm không đủ hàng');
      }

      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: finalQuantity },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          quantity: dto.quantity,
        },
      });
    }

    return this.refreshCart(userId);
  }

  async updateItem(
    userId: number,
    itemId: number,
    dto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    const cartItem = await this.findOwnedCartItem(userId, itemId);
    await this.validateProductAvailability(cartItem.productId, dto.quantity);

    await this.prisma.cartItem.update({
      where: { id: cartItem.id },
      data: { quantity: dto.quantity },
    });

    return this.refreshCart(userId);
  }

  async removeItem(userId: number, itemId: number): Promise<CartResponseDto> {
    const cartItem = await this.findOwnedCartItem(userId, itemId);

    await this.prisma.cartItem.delete({
      where: { id: cartItem.id },
    });

    return this.refreshCart(userId);
  }

  async clearCart(userId: number): Promise<CartResponseDto> {
    const cart = await this.getOrCreateActiveCart(userId);

    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return this.refreshCart(userId);
  }

  private async refreshCart(userId: number): Promise<CartResponseDto> {
    await this.redisService.del(CACHE_KEYS.CART(userId));
    return this.getCart(userId);
  }

  private async getOrCreateActiveCart(userId: number) {
    const existingCart = await this.prisma.cart.findFirst({
      where: {
        userId,
        status: CartStatus.ACTIVE,
      },
    });

    if (existingCart) {
      return existingCart;
    }

    return this.prisma.cart.create({
      data: {
        userId,
        status: CartStatus.ACTIVE,
      },
    });
  }

  private async getCartWithItems(userId: number) {
    const cart = await this.getOrCreateActiveCart(userId);

    return this.prisma.cart.findUniqueOrThrow({
      where: { id: cart.id },
      include: {
        items: {
          orderBy: { id: 'asc' },
          include: {
            product: true,
          },
        },
      },
    });
  }

  private async validateProductAvailability(
    productId: number,
    quantity: number,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    if (product.status !== ProductStatus.ACTIVE || product.deletedAt) {
      throw new BadRequestException('Sản phẩm không còn bán');
    }

    if (product.stock < quantity) {
      throw new BadRequestException('Sản phẩm không đủ hàng');
    }

    return product;
  }

  private async findOwnedCartItem(userId: number, itemId: number) {
    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: {
          userId,
          status: CartStatus.ACTIVE,
        },
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Không tìm thấy sản phẩm trong giỏ hàng');
    }

    return cartItem;
  }

  private serializeCart(
    cart: Prisma.CartGetPayload<{
      include: {
        items: {
          include: {
            product: true;
          };
        };
      };
    }>,
  ): CartResponseDto {
    const subtotal = cart.items.reduce(
      (sum, item) => sum.plus(item.product.price.mul(item.quantity)),
      new Prisma.Decimal(0),
    );

    return {
      id: cart.id,
      items: cart.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        name: item.product.name,
        slug: item.product.slug,
        price: item.product.price.toString(),
        quantity: item.quantity,
        subtotal: item.product.price.mul(item.quantity).toString(),
      })),
      totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: subtotal.toString(),
    };
  }
}
