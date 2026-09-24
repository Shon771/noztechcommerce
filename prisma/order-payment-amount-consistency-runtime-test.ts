import 'dotenv/config';

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

import { PaymentService } from '../src/modules/payment/payment.service';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log(
    '=== 2J.24-C ORDER PAYMENT AMOUNT CONSISTENCY RUNTIME TEST ===',
  );

  const orderId =
    '2ba38b1a-4dc0-4b12-b77d-1020bbd1449e';

  const paymentId =
    '15d50e37-5249-46de-a436-0bc8ec8f54c5';

  const paymentService =
    new PaymentService(
      prisma as any,
    );

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

  const payment =
    await paymentService.findByOrderId(
      orderId,
    );

  if (!payment) {
    throw new Error(
      'Payment fixture tidak ditemukan.',
    );
  }

  const orderTotal =
    Number(order.total);

  const paymentAmount =
    Number(payment.amount);

  console.log(
    'ORDER ID:',
    order.id,
  );

  console.log(
    'PAYMENT ID:',
    payment.id,
  );

  console.log(
    'ORDER TOTAL:',
    orderTotal,
  );

  console.log(
    'PAYMENT AMOUNT:',
    paymentAmount,
  );

  console.log(
    'PAYMENT ORDER ID:',
    payment.orderId,
  );

  if (payment.id !== paymentId) {
    throw new Error(
      'Payment yang ditemukan bukan payment fixture.',
    );
  }

  if (payment.orderId !== orderId) {
    throw new Error(
      'Payment terhubung ke Order yang salah.',
    );
  }

  if (orderTotal !== paymentAmount) {
    throw new Error(
      `Order total (${orderTotal}) tidak sama dengan payment amount (${paymentAmount}).`,
    );
  }

  console.log(
    'PAYMENT FOUND: PASS',
  );

  console.log(
    'PAYMENT → ORDER INTEGRITY: PASS',
  );

  console.log(
    'ORDER TOTAL ↔ PAYMENT AMOUNT: PASS',
  );

  console.log(
    'AMOUNT CONSISTENCY RUNTIME: PASS',
  );

  console.log(
    '=== 2J.24-C RUNTIME TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.24-C RUNTIME TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });