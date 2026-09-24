import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findOrCreateByCustomerId(
    customerId: string,
  ) {
    const existingCart =
      await this.prisma.cart.findUnique({
        where: {
          customerId,
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

    if (existingCart) {
      return existingCart;
    }

    return this.prisma.cart.create({
      data: {
        customerId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async addItem(
    customerId: string,
    productId: string,
  ) {
    const cart =
      await this.findOrCreateByCustomerId(
        customerId,
      );

    const product =
      await this.prisma.product.findUnique({
        where: {
          id: productId,
        },
      });

    if (!product) {
      throw new Error(
        'Produk tidak ditemukan.',
      );
    }

    if (product.status !== 'ACTIVE') {
      throw new Error(
        'Produk tidak tersedia.',
      );
    }

    const existingItem =
      await this.prisma.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId,
          },
        },
      });

    const currentQuantity =
      existingItem?.quantity ?? 0;

    if (currentQuantity >= product.stock) {
      throw new Error(
        'Stok produk tidak mencukupi.',
      );
    }

    const item =
      existingItem
        ? await this.prisma.cartItem.update({
            where: {
              id: existingItem.id,
            },
            data: {
              quantity: {
                increment: 1,
              },
            },
            include: {
              product: true,
            },
          })
        : await this.prisma.cartItem.create({
            data: {
              cartId: cart.id,
              productId,
              quantity: 1,
            },
            include: {
              product: true,
            },
          });

    return item;
  }

  async getCart(
    customerId: string,
  ) {
    return this.prisma.cart.findUnique({
      where: {
        customerId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }

  async increaseItem(
    customerId: string,
    productId: string,
  ) {
    const cart =
      await this.findOrCreateByCustomerId(
        customerId,
      );

    const item =
      await this.prisma.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId,
          },
        },
        include: {
          product: true,
        },
      });

    if (!item) {
      throw new Error(
        'Produk tidak ada di keranjang.',
      );
    }

    if (item.product.status !== 'ACTIVE') {
      throw new Error(
        'Produk tidak tersedia.',
      );
    }

    if (item.quantity >= item.product.stock) {
      throw new Error(
        'Jumlah sudah mencapai stok maksimum.',
      );
    }

    return this.prisma.cartItem.update({
      where: {
        id: item.id,
      },
      data: {
        quantity: {
          increment: 1,
        },
      },
      include: {
        product: true,
      },
    });
  }

  async decreaseItem(
    customerId: string,
    productId: string,
  ) {
    const cart =
      await this.findOrCreateByCustomerId(
        customerId,
      );

    const item =
      await this.prisma.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId,
          },
        },
        include: {
          product: true,
        },
      });

    if (!item) {
      throw new Error(
        'Produk tidak ada di keranjang.',
      );
    }

    if (item.quantity <= 1) {
      throw new Error(
        'Jumlah minimum adalah 1. Gunakan Hapus untuk menghapus produk.',
      );
    }

       return this.prisma.cartItem.update({
      where: {
        id: item.id,
      },
      data: {
        quantity: {
          decrement: 1,
        },
      },
      include: {
        product: true,
      },
    });
  }

  async removeItem(
    customerId: string,
    productId: string,
  ) {
    const cart =
      await this.findOrCreateByCustomerId(
        customerId,
      );

    const item =
      await this.prisma.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId,
          },
        },
        include: {
          product: true,
        },
      });

    if (!item) {
      throw new Error(
        'Produk tidak ada di keranjang.',
      );
    }

    await this.prisma.cartItem.delete({
      where: {
        id: item.id,
      },
    });

    return item;
  }
}