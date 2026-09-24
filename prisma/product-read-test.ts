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
    console.log('=== PRODUCT READ TEST ===');

    const products = await prisma.product.findMany();

    console.log('PRODUCT COUNT:', products.length);
    console.dir(products, { depth: null });

    console.log('=== PRODUCT READ TEST PASS ===');
  } catch (error) {
    console.error('=== PRODUCT READ TEST ERROR ===');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

void main();