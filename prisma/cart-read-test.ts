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
    console.log('=== CART SERVICE READ TEST ===');

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

    const cart =
      await cartService.getCart(
        customer.id,
      );

    if (!cart) {
      throw new Error(
        'Cart tidak ditemukan.',
      );
    }

    console.log('CART ID:', cart.id);

    console.log(
      'CART ITEM COUNT:',
      cart.items.length,
    );

    console.dir(cart.items, {
      depth: 3,
    });

    if (cart.items.length === 0) {
      throw new Error(
        'Cart kosong.',
      );
    }

    const firstItem = cart.items[0];

    if (!firstItem.product) {
      throw new Error(
        'Product relation tidak ditemukan.',
      );
    }

    console.log(
      'FIRST PRODUCT:',
      firstItem.product.name,
    );

    console.log(
      'FIRST QUANTITY:',
      firstItem.quantity,
    );

    console.log(
      '=== CART SERVICE READ TEST PASS ===',
    );
  } catch (error) {
    console.error(
      '=== CART SERVICE READ TEST ERROR ===',
    );

    console.error(error);

    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();