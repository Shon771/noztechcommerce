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
    '=== 2J.13-C PROCESSING IDEMPOTENCY FINAL READ-BACK ===',
  );

  const order =
    await prisma.order.findUnique({
      where: {
        id: 'ce71c720-969d-47bd-977f-b01d4b8a4792',
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

  if (order.status !== 'PROCESSING') {
    throw new Error(
      `Expected PROCESSING, got ${order.status}`,
    );
  }

  console.log(
    'PROCESSING STATE PRESERVED: PASS',
  );

  console.log(
    'IDEMPOTENCY PERSISTENCE: PASS',
  );

  console.log(
    '=== 2J.13-C FINAL READ-BACK PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.13-C FINAL READ-BACK ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });