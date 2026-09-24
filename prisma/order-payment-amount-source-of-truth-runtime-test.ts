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
    '=== 2J.24-D ORDER PAYMENT AMOUNT SOURCE-OF-TRUTH RUNTIME TEST ===',
  );

  const customer = await prisma.customer.create({
    data: {
      name: '2J24-D Source Of Truth Customer',
      telegramId: `2j24d-source-${Date.now()}`,
    },
  });

  const order = await prisma.order.create({
    data: {
      orderNumber: `NT-2J24-D-SOT-${Date.now()}`,
      status: 'PENDING',
      subtotal: 35000,
      shippingCost: 0,
      discount: 0,
      total: 35000,
      customerId: customer.id,
    },
  });

  const paymentService =
    new PaymentService(
      prisma as any,
    );

  const payment =
    await paymentService.createPendingPayment(
      order.id,
      'QRIS',
    );

  console.log(
    'ORDER ID:',
    order.id,
  );

  console.log(
    'ORDER TOTAL:',
    Number(order.total),
  );

  console.log(
    'PAYMENT ID:',
    payment.id,
  );

  console.log(
    'PAYMENT AMOUNT:',
    Number(payment.amount),
  );

  console.log(
    'PAYMENT METHOD:',
    payment.method,
  );

  if (
    Number(payment.amount) !==
    Number(order.total)
  ) {
    throw new Error(
      `Payment amount (${payment.amount}) tidak sama dengan Order total (${order.total}).`,
    );
  }

  console.log(
    'PAYMENT AMOUNT DERIVED FROM ORDER TOTAL: PASS',
  );

  console.log(
    'ORDER TOTAL ↔ PAYMENT AMOUNT: PASS',
  );

  console.log(
    'SOURCE OF TRUTH ENFORCEMENT: PASS',
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