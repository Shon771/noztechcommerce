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
    '=== 2J.26-E PENDING ORDER PAYMENT CONSISTENCY FINAL READ-BACK ===',
  );

  const orderId =
    '2e8fcdfc-3560-4498-b759-6fa098613095';

  const paymentId =
    '7261e2da-2fb6-4278-81d0-02bc1b38514f';

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

  if (order.status !== 'PENDING') {
    throw new Error(
      `Order seharusnya PENDING, tetapi ${order.status}.`,
    );
  }

  if (payment.status !== 'PAID') {
    throw new Error(
      `Payment seharusnya PAID, tetapi ${payment.status}.`,
    );
  }

  if (payment.orderId !== orderId) {
    throw new Error(
      'Payment → Order relation berubah.',
    );
  }

  if (!payment.paidAt) {
    throw new Error(
      'paidAt tidak tersimpan.',
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
    'PAID AT:',
    payment.paidAt,
  );

  console.log(
    'PENDING ORDER STATE PERSISTED: PASS',
  );

  console.log(
    'PAYMENT PAID STATE PERSISTED: PASS',
  );

  console.log(
    'PAYMENT → ORDER RELATION PRESERVED: PASS',
  );

  console.log(
    'PAID TIMESTAMP PERSISTED: PASS',
  );

  console.log(
    'PENDING + PAID STATE CONSISTENCY: PASS',
  );

  console.log(
    '=== 2J.26-E FINAL READ-BACK PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.26-E FINAL READ-BACK ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });