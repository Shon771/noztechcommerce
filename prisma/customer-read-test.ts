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
    console.log('=== CUSTOMER READ TEST ===');

    const customers = await prisma.customer.findMany();

    console.log(
      'CUSTOMER COUNT:',
      customers.length,
    );

    console.dir(customers, {
      depth: null,
    });

    console.log(
      '=== CUSTOMER READ TEST PASS ===',
    );
  } catch (error) {
    console.error(
      '=== CUSTOMER READ TEST ERROR ===',
    );
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

void main();