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
    '=== 2J.19-A PENDING CANCELLATION FINAL READ-BACK ===',
  );

  const order =
    await prisma.order.findUnique({
      where: {
        id: '0bde0c70-b67f-40d0-b378-f4c00b245498',
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

  if (order.status !== 'CANCELLED') {
    throw new Error(
      `Expected CANCELLED, got ${order.status}`,
    );
  }

  console.log(
    'CANCELLED STATE PRESERVED: PASS',
  );

  console.log(
    'PENDING → CANCELLED PERSISTENCE: PASS',
  );

  console.log(
    '=== 2J.19-A FINAL READ-BACK PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.19-A FINAL READ-BACK ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });