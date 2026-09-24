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
    console.log('=== CUSTOMER CREATE TEST ===');

    const telegramId = 'TEST-TELEGRAM-001';

    const existingCustomer =
      await prisma.customer.findUnique({
        where: {
          telegramId,
        },
      });

    const customer =
      existingCustomer ??
      (await prisma.customer.create({
        data: {
          telegramId,
          name: 'Test Customer',
          telegramUsername: 'test_customer',
        },
      }));

    console.log('CUSTOMER ID:', customer.id);
    console.log('TELEGRAM ID:', customer.telegramId);
    console.log('CUSTOMER NAME:', customer.name);

    console.log(
      '=== CUSTOMER CREATE TEST PASS ===',
    );
  } catch (error) {
    console.error(
      '=== CUSTOMER CREATE TEST ERROR ===',
    );
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

void main();