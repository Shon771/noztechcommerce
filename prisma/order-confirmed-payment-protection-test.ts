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
    '=== 2J.10-C CONFIRMED ORDER PROTECTION TEST ===',
  );

  const customer =
    await prisma.customer.create({
      data: {
        name: '2J10-C Confirmed Order Test',
        telegramId: `TEST-2J10-C-${Date.now()}`,
      },
    });

  const order =
    await prisma.order.create({
      data: {
        orderNumber: `NT-2J10-C-${Date.now()}`,
        status: 'CONFIRMED',
        subtotal: 10000,
        shippingCost: 0,
        discount: 0,
        total: 10000,
        customerId: customer.id,
      },
    });

  const payment =
    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: 10000,
        method: 'COD',
        status: 'PAID',
        transactionId: `TEST-2J10-C-ORIGINAL-${Date.now()}`,
        paidAt: new Date(),
      },
    });

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
    'PAYMENT ID:',
    payment.id,
  );

  console.log(
    'PAYMENT STATUS:',
    payment.status,
  );

  console.log(
    'TRANSACTION ID:',
    payment.transactionId,
  );

  if (order.status !== 'CONFIRMED') {
    throw new Error(
      `Expected CONFIRMED, got ${order.status}`,
    );
  }

  if (payment.status !== 'PAID') {
    throw new Error(
      `Expected PAID, got ${payment.status}`,
    );
  }

  if (!payment.transactionId) {
    throw new Error(
      'TransactionId tidak boleh null.',
    );
  }

  console.log(
    'INITIAL CONFIRMED STATE: PASS',
  );

  console.log(
    '=== 2J.10-C SETUP PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.10-C SETUP ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });