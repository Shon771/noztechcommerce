import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

async function main() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });

  const prisma = new PrismaClient({
    adapter,
  });

  try {
    console.log('=== CART REMOVE TEST ===');

    const customer =
      await prisma.customer.findUnique({
        where: {
          telegramId: 'TEST-TELEGRAM-001',
        },
      });

    if (!customer) {
      throw new Error(
        'Test customer tidak ditemukan.',
      );
    }

    const product =
      await prisma.product.findUnique({
        where: {
          sku: 'NTC-BERAS-001',
        },
      });

    if (!product) {
      throw new Error(
        'Test product tidak ditemukan.',
      );
    }

    const cart =
      await prisma.cart.findUnique({
        where: {
          customerId: customer.id,
        },
      });

    if (!cart) {
      throw new Error(
        'Test cart tidak ditemukan.',
      );
    }

    let cartItem =
      await prisma.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId: product.id,
          },
        },
      });

    if (!cartItem) {
      cartItem =
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: product.id,
            quantity: 2,
          },
        });
    }

    const originalQuantity =
      cartItem.quantity;

    console.log(
      'BEFORE REMOVE:',
      originalQuantity,
    );

    await prisma.cartItem.delete({
      where: {
        id: cartItem.id,
      },
    });

    const removedItem =
      await prisma.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId: product.id,
          },
        },
      });

    if (removedItem) {
      throw new Error(
        'CartItem masih ada setelah remove.',
      );
    }

    console.log(
      'AFTER REMOVE: CART ITEM NOT FOUND',
    );

    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product.id,
        quantity: originalQuantity,
      },
    });

    console.log(
      'RESTORED QUANTITY:',
      originalQuantity,
    );

    console.log(
      '=== CART REMOVE TEST PASS ===',
    );
  } catch (error) {
    console.error(
      '=== CART REMOVE TEST ERROR ===',
    );

    console.error(error);

    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();