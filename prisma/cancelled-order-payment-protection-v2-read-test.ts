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
    '=== 2J.26-A V2 CANCELLED ORDER PAYMENT PROTECTION FINAL READ-BACK ===',
  );

  const orderId =
    'c818814e-eb36-465e-8a65-f64bbf56bb94';

  const paymentId =
    'ca68a6c2-acc9-4079-b785-d5b6b43595cd';

  const order =
    await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

  const payment =
    await prisma.payment.findUnique({
      where: {
        id: paymentId,
      },
    });

  if (!order) {
    throw new Error(
      'Order fixture tidak ditemukan.',
    );
  }

  if (!payment) {
    throw new Error(
      'Payment fixture tidak ditemukan.',
    );
  }

  if (order.status !== 'CANCELLED') {
    throw new Error(
      `Order seharusnya CANCELLED, tetapi ${order.status}.`,
    );
  }

  if (payment.status !== 'PENDING') {
    throw new Error(
      `Payment seharusnya PENDING, tetapi ${payment.status}.`,
    );
  }

  if (payment.orderId !== orderId) {
    throw new Error(
      'Payment → Order relation berubah.',
    );
  }

  console.log(
    'ORDER ID:',
    order.id,
  );

  console.log(
    'ORDER STATUS:',
    order.status,
  );

  console.log(
    'PAYMENT ID:',
    payment.id,
  );

  console.log(
    'PAYMENT ORDER ID:',
    payment.orderId,
  );

  console.log(
    'PAYMENT STATUS:',
    payment.status,
  );

  console.log(
    'CANCELLED ORDER STATE PERSISTED: PASS',
  );

  console.log(
    'PAYMENT PENDING STATE PERSISTED: PASS',
  );

  console.log(
    'PAYMENT NOT PROMOTED TO PAID: PASS',
  );

  console.log(
    'PAYMENT → ORDER RELATION PRESERVED: PASS',
  );

  console.log(
    'CANCELLED ORDER PAYMENT PROTECTION PERSISTED: PASS',
  );

  console.log(
    '=== 2J.26-A V2 FINAL READ-BACK PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.26-A V2 FINAL READ-BACK ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });