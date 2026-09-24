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
    '=== 2J.25-C PAYMENT TERMINAL STATE PROTECTION TEST ===',
  );

  const states = [
    'FAILED',
    'EXPIRED',
    'REFUNDED',
  ] as const;

  for (const state of states) {
    const customer =
      await prisma.customer.create({
        data: {
          name:
            `2J25-C ${state} Customer`,
          telegramId:
            `2j25c-${state.toLowerCase()}-${Date.now()}`,
        },
      });

    const order =
      await prisma.order.create({
        data: {
          orderNumber:
            `NT-2J25-C-${state}-${Date.now()}`,
          status: 'PENDING',
          subtotal: 60000,
          shippingCost: 0,
          discount: 0,
          total: 60000,
          customerId: customer.id,
        },
      });

    const payment =
      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: order.total,
          method: 'QRIS',
          status: state,
        },
      });

    console.log('');
    console.log(
      `--- ${state} FIXTURE ---`,
    );

    console.log(
      'ORDER ID:',
      order.id,
    );

    console.log(
      'PAYMENT ID:',
      payment.id,
    );

    console.log(
      'PAYMENT STATUS:',
      payment.status,
    );

    console.log(
      'PAYMENT AMOUNT:',
      Number(payment.amount),
    );

    if (payment.status !== state) {
      throw new Error(
        `${state} fixture state tidak sesuai.`,
      );
    }

    if (payment.orderId !== order.id) {
      throw new Error(
        `${state} Payment tidak terhubung ke Order yang benar.`,
      );
    }

    if (
      Number(payment.amount) !==
      Number(order.total)
    ) {
      throw new Error(
        `${state} Payment amount tidak sesuai Order total.`,
      );
    }

    console.log(
      `${state} INITIAL STATE: PASS`,
    );

    console.log(
      `${state} PAYMENT → ORDER RELATION: PASS`,
    );

    console.log(
      `${state} AMOUNT CONSISTENCY: PASS`,
    );
  }

  console.log('');
  console.log(
    '=== 2J.25-C SETUP PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.25-C SETUP ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });