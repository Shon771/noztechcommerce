import 'dotenv/config';
import { PrismaClient } from './generated/prisma-seed/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const sembako = await prisma.category.upsert({
    where: {
      slug: 'sembako',
    },
    update: {},
    create: {
      name: 'Sembako',
      slug: 'sembako',
      description: 'Kebutuhan pokok sehari-hari',
    },
  });

  await prisma.product.upsert({
    where: {
      sku: 'NTC-BERAS-001',
    },
    update: {},
    create: {
      sku: 'NTC-BERAS-001',
      name: 'Beras Premium 5 Kg',
      slug: 'beras-premium-5-kg',
      description: 'Beras premium kemasan 5 Kg',
      price: 75000,
      stock: 20,
      status: 'ACTIVE',
      categoryId: sembako.id,
    },
  });

  await prisma.product.upsert({
    where: {
      sku: 'NTC-MINYAK-001',
    },
    update: {},
    create: {
      sku: 'NTC-MINYAK-001',
      name: 'Minyak Goreng 1 Liter',
      slug: 'minyak-goreng-1-liter',
      description: 'Minyak goreng kemasan 1 Liter',
      price: 18000,
      stock: 30,
      status: 'ACTIVE',
      categoryId: sembako.id,
    },
  });

  await prisma.product.upsert({
    where: {
      sku: 'NTC-TELUR-001',
    },
    update: {},
    create: {
      sku: 'NTC-TELUR-001',
      name: 'Telur Ayam 1 Kg',
      slug: 'telur-ayam-1-kg',
      description: 'Telur ayam segar',
      price: 30000,
      stock: 25,
      status: 'ACTIVE',
      categoryId: sembako.id,
    },
  });

  console.log('Product seed berhasil 🌱');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });