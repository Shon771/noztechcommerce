import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { CartService } from '../src/modules/cart/cart.service';

async function main() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });

  const prisma = new PrismaClient({
    adapter,
  });

  const cartService = new CartService(prisma);

  try {
    console.log(
      '=== CART QUANTITY TEST ===',
    );

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

    const existingItem =
      await prisma.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId: product.id,
          },
        },
      });

    if (!existingItem) {
      throw new Error(
        'Test CartItem tidak ditemukan.',
      );
    }

    console.log(
      'INITIAL QUANTITY:',
      existingItem.quantity,
    );

    const originalQuantity =
      existingItem.quantity;

    const increased =
      await cartService.increaseItem(
        customer.id,
        product.id,
      );

    console.log(
      'AFTER INCREASE:',
      increased.quantity,
    );

    if (
      increased.quantity !==
      originalQuantity + 1
    ) {
      throw new Error(
        'Increase quantity gagal.',
      );
    }

    const decreased =
      await cartService.decreaseItem(
        customer.id,
        product.id,
      );

    console.log(
      'AFTER DECREASE:',
      decreased.quantity,
    );

    if (
      decreased.quantity !==
      originalQuantity
    ) {
      throw new Error(
        'Decrease quantity gagal.',
      );
    }

    console.log(
      '=== CART QUANTITY TEST PASS ===',
    );
  } catch (error) {
    console.error(
      '=== CART QUANTITY TEST ERROR ===',
    );

    console.error(error);

    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();