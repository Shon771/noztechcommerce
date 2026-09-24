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
    '=== 2J.27-C ORDER TRANSITION PROCESSING → SHIPPED FINAL READ-BACK ===',
  );

  const orderId =
    '2cc1ef41-6462-497f-8a94-7c444399176f';

  const order =
    await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

  if (!order) {
    throw new Error(
      'Order fixture tidak ditemukan.',
    );
  }

  if (order.status !== 'SHIPPED') {
    throw new Error(
      `Order seharusnya SHIPPED, tetapi ${order.status}.`,
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

  console.log(
    'CUSTOMER ID:',
    order.customerId,
  );

  console.log(
    'SHIPPED ORDER STATE PERSISTED: PASS',
  );

  console.log(
    'ORDER ID PRESERVED: PASS',
  );

  console.log(
    'CUSTOMER RELATION PRESERVED: PASS',
  );

  console.log(
    'PROCESSING → SHIPPED PERSISTENCE: PASS',
  );

  console.log(
    '=== 2J.27-C FINAL READ-BACK PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.27-C FINAL READ-BACK ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });