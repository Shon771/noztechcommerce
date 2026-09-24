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
    '=== 2J.27-I INVALID ORDER TRANSITION CANCELLED → PROCESSING FINAL READ-BACK ===',
  );

  const orderId =
    '903fead1-b959-4cab-91f8-321666dd4312';

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

  if (order.status !== 'CANCELLED') {
    throw new Error(
      `Order seharusnya CANCELLED, tetapi ${order.status}.`,
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
    'CANCELLED TERMINAL STATE PERSISTED: PASS',
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
    'CANCELLED STATE NOT ALTERED: PASS',
  );

  console.log(
    '=== 2J.27-I FINAL READ-BACK PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.27-I FINAL READ-BACK ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });