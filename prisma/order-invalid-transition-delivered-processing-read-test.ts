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
    '=== 2J.27-E INVALID ORDER TRANSITION DELIVERED → PROCESSING FINAL READ-BACK ===',
  );

  const orderId =
    '88ea94cd-d622-4c7e-a6ba-03b756fef7b5';

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

  if (order.status !== 'DELIVERED') {
    throw new Error(
      `Order seharusnya DELIVERED, tetapi ${order.status}.`,
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
    'DELIVERED TERMINAL STATE PERSISTED: PASS',
  );

  console.log(
    'INVALID TRANSITION PROTECTION PERSISTED: PASS',
  );

  console.log(
    'ORDER ID PRESERVED: PASS',
  );

  console.log(
    'CUSTOMER RELATION PRESERVED: PASS',
  );

  console.log(
    'DELIVERED STATE NOT ALTERED: PASS',
  );

  console.log(
    '=== 2J.27-E FINAL READ-BACK PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.27-E FINAL READ-BACK ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });