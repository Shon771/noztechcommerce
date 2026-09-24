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
    '=== PAYMENT TRANSACTION OVERWRITE TEST ===',
  );

  const customer =
    await prisma.customer.create({
      data: {
        name: '2J9 Transaction Overwrite Test',
        telegramId: `TEST-2J9-B-${Date.now()}`,
      },
    });

  const order =
    await prisma.order.create({
      data: {
        orderNumber: `NT-2J9-B-${Date.now()}`,
        status: 'PENDING',
        subtotal: 10000,
        shippingCost: 0,
        discount: 0,
        total: 10000,
        customerId: customer.id,
      },
    });

  const originalTransactionId =
    `TEST-2J9-ORIGINAL-${Date.now()}`;

  const payment =
    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: 10000,
        method: 'COD',
        status: 'PAID',
        transactionId: originalTransactionId,
        paidAt: new Date(),
      },
    });

  console.log(
    'PAYMENT ID:',
    payment.id,
  );

  console.log(
    'ORIGINAL TRANSACTION ID:',
    payment.transactionId,
  );

  const attemptedTransactionId =
    `TEST-2J9-OVERWRITE-${Date.now()}`;

  console.log(
    'ATTEMPTED NEW TRANSACTION ID:',
    attemptedTransactionId,
  );

  const paymentBefore =
    await prisma.payment.findUnique({
      where: {
        id: payment.id,
      },
    });

  if (!paymentBefore) {
    throw new Error(
      'Payment tidak ditemukan setelah create.',
    );
  }

  if (
    paymentBefore.transactionId !==
    originalTransactionId
  ) {
    throw new Error(
      'Initial transactionId tidak sesuai.',
    );
  }

  console.log(
    'ORIGINAL TRANSACTION ID VERIFIED: PASS',
  );

  console.log(
    '=== PAYMENT TRANSACTION OVERWRITE TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== PAYMENT TRANSACTION OVERWRITE TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });