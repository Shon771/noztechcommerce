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
    console.log('=== CART ITEM TEST ===');

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
            quantity: 1,
          },
        });
    } else {
      cartItem =
        await prisma.cartItem.update({
          where: {
            id: cartItem.id,
          },
          data: {
            quantity: {
              increment: 1,
            },
          },
        });
    }

    console.log(
      'AFTER FIRST ADD:',
      cartItem.quantity,
    );

    cartItem =
      await prisma.cartItem.update({
        where: {
          id: cartItem.id,
        },
        data: {
          quantity: {
            increment: 1,
          },
        },
      });

    console.log(
      'AFTER SECOND ADD:',
      cartItem.quantity,
    );

    const cartItems =
      await prisma.cartItem.findMany({
        where: {
          cartId: cart.id,
        },
      });

    console.log(
      'CART ITEM COUNT:',
      cartItems.length,
    );

    if (
      cartItem.quantity !== 2 ||
      cartItems.length !== 1
    ) {
      throw new Error(
        'CartItem test gagal.',
      );
    }

    console.log(
      '=== CART ITEM TEST PASS ===',
    );
  } catch (error) {
    console.error(
      '=== CART ITEM TEST ERROR ===',
    );
    console.error(error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();