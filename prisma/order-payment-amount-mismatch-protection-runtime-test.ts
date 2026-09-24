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
    '=== 2J.24-D ORDER PAYMENT AMOUNT MISMATCH PROTECTION RUNTIME TEST ===',
  );

  const orderId =
    '245921d5-66cb-4810-b92a-ddb4f8915323';

  const paymentId =
    '752bc69f-9383-4b77-aae2-f635f983858d';

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

  if (orderTotal === paymentAmount) {
    throw new Error(
      'Mismatch fixture tidak lagi mismatch.',
    );
  }

  console.log(
    'MISMATCH DETECTED: PASS',
  );

  console.log(
    'ORDER ↔ PAYMENT RELATION: PASS',
  );

  console.log(
    'MISMATCH CURRENTLY REACHABLE: PASS',
  );

  console.log(
    '=== 2J.24-D RUNTIME TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.24-D RUNTIME TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });