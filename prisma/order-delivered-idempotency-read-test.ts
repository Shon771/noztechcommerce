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
    '=== 2J.15-C DELIVERED IDEMPOTENCY FINAL READ-BACK ===',
  );

  const order =
    await prisma.order.findUnique({
      where: {
        id: '9cc63df6-3a45-4142-8bc7-349cd4e870e7',
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

  if (order.status !== 'DELIVERED') {
    throw new Error(
      `Expected DELIVERED, got ${order.status}`,
    );
  }

  console.log(
    'DELIVERED STATE PRESERVED: PASS',
  );

  console.log(
    'IDEMPOTENCY PERSISTENCE: PASS',
  );

  console.log(
    '=== 2J.15-C FINAL READ-BACK PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.15-C FINAL READ-BACK ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });