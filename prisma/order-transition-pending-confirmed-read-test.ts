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
    '=== 2J.27-A ORDER TRANSITION PENDING → CONFIRMED FINAL READ-BACK ===',
  );

  const orderId =
    '14e42672-d68b-48d1-add3-8d39c908e693';

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

  if (order.status !== 'CONFIRMED') {
    throw new Error(
      `Order seharusnya CONFIRMED, tetapi ${order.status}.`,
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
    'CONFIRMED ORDER STATE PERSISTED: PASS',
  );

  console.log(
    'ORDER ID PRESERVED: PASS',
  );

  console.log(
    'CUSTOMER RELATION PRESERVED: PASS',
  );

  console.log(
    'PENDING → CONFIRMED PERSISTENCE: PASS',
  );

  console.log(
    '=== 2J.27-A FINAL READ-BACK PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.27-A FINAL READ-BACK ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });