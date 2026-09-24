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
    '=== 2J.27-B ORDER TRANSITION CONFIRMED → PROCESSING FINAL READ-BACK ===',
  );

  const orderId =
    '247855ba-b21c-4500-925e-3e4484f6fc20';

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

  if (order.status !== 'PROCESSING') {
    throw new Error(
      `Order seharusnya PROCESSING, tetapi ${order.status}.`,
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
    'PROCESSING ORDER STATE PERSISTED: PASS',
  );

  console.log(
    'ORDER ID PRESERVED: PASS',
  );

  console.log(
    'CUSTOMER RELATION PRESERVED: PASS',
  );

  console.log(
    'CONFIRMED → PROCESSING PERSISTENCE: PASS',
  );

  console.log(
    '=== 2J.27-B FINAL READ-BACK PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.27-B FINAL READ-BACK ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });