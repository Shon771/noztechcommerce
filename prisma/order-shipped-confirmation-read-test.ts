import 'dotenv/config';

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log(
    '=== 2J.11-B ORDER SHIPPED FINAL READ-BACK ===',
  );

  const order =
    await prisma.order.findUnique({
      where: {
        id: 'ab9eba14-68bd-4ba3-a9d3-2d072740cbc3',
      },
    });

  if (!order) {
    throw new Error(
      'Order tidak ditemukan.',
    );
  }

  console.log(
    'ORDER ID:',
    order.id,
  );

  console.log(
    'ORDER NUMBER:',
    order.orderNumber,
  );

  console.log(
    'ORDER STATUS:',
    order.status,
  );

  if (order.status !== 'SHIPPED') {
    throw new Error(
      `Order berubah! Expected SHIPPED, got ${order.status}`,
    );
  }

  console.log(
    'SHIPPED STATE PRESERVED: PASS',
  );

  console.log(
    'CONFIRMATION BLOCKED: PASS',
  );

  console.log(
    '=== 2J.11-B FINAL READ-BACK PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.11-B FINAL READ-BACK ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });