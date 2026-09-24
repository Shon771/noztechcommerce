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
    '=== 2J.24-C ORDER PAYMENT AMOUNT CONSISTENCY FINAL READ-BACK ===',
  );

  const orderId =
    '2ba38b1a-4dc0-4b12-b77d-1020bbd1449e';

  const paymentId =
    '15d50e37-5249-46de-a436-0bc8ec8f54c5';

  const order =
    await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
        payment: true,
      },
    });

  if (!order) {
    throw new Error(
      'Order fixture tidak ditemukan.',
    );
  }

  if (!order.payment) {
    throw new Error(
      'Payment seharusnya tetap ada.',
    );
  }

  const orderTotal =
    Number(order.total);

  const paymentAmount =
    Number(order.payment.amount);

  console.log(
    'ORDER ID:',
    order.id,
  );

  console.log(
    'ORDER TOTAL:',
    orderTotal,
  );

  console.log(
    'PAYMENT ID:',
    order.payment.id,
  );

  console.log(
    'PAYMENT ORDER ID:',
    order.payment.orderId,
  );

  console.log(
    'PAYMENT AMOUNT:',
    paymentAmount,
  );

  if (order.payment.id !== paymentId) {
    throw new Error(
      'Payment ID tidak sesuai fixture.',
    );
  }

  if (order.payment.orderId !== orderId) {
    throw new Error(
      'Payment orderId tidak sesuai Order.',
    );
  }

  if (orderTotal !== paymentAmount) {
    throw new Error(
      `Order total (${orderTotal}) tidak sama dengan payment amount (${paymentAmount}).`,
    );
  }

  console.log(
    'PAYMENT RELATION PRESERVED: PASS',
  );

  console.log(
    'ORDER TOTAL ↔ PAYMENT AMOUNT PRESERVED: PASS',
  );

  console.log(
    'AMOUNT CONSISTENCY PERSISTENCE: PASS',
  );

  console.log(
    '=== 2J.24-C FINAL READ-BACK PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.24-C FINAL READ-BACK ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });