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
    console.log('=== CART CREATE TEST ===');

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

    const existingCart =
      await prisma.cart.findUnique({
        where: {
          customerId: customer.id,
        },
      });

    const cart =
      existingCart ??
      (await prisma.cart.create({
        data: {
          customerId: customer.id,
        },
      }));

    console.log('CUSTOMER ID:', customer.id);
    console.log('CART ID:', cart.id);
    console.log('CART CUSTOMER ID:', cart.customerId);

    console.log(
      '=== CART CREATE TEST PASS ===',
    );
  } catch (error) {
    console.error(
      '=== CART CREATE TEST ERROR ===',
    );
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

void main();