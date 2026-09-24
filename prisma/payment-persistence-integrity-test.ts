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
    '=== PAYMENT PERSISTENCE INTEGRITY TEST ===',
  );

  const customer =
    await prisma.customer.create({
      data: {
        name: '2J9 Persistence Integrity Test',
        telegramId: `TEST-2J9-C-${Date.now()}`,
      },
    });

  const order =
    await prisma.order.create({
      data: {
        orderNumber: `NT-2J9-C-${Date.now()}`,
        status: 'PENDING',
        subtotal: 10000,
        shippingCost: 0,
        discount: 0,
        total: 10000,
        customerId: customer.id,
      },
    });

  const transactionId =
    `TEST-2J9-PERSIST-${Date.now()}`;

  const payment =
    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: 10000,
        method: 'COD',
        status: 'PENDING',
      },
    });

  console.log(
    'PAYMENT ID:',
    payment.id,
  );

  console.log(
    'INITIAL STATUS:',
    payment.status,
  );

  console.log(
    'INITIAL TRANSACTION ID:',
    payment.transactionId,
  );

  console.log(
    'INITIAL PAID AT:',
    payment.paidAt,
  );

  const confirmedPayment =
    await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: 'PAID',
        transactionId,
        paidAt: new Date(),
      },
    });

  console.log(
    'CONFIRMED STATUS:',
    confirmedPayment.status,
  );

  console.log(
    'CONFIRMED TRANSACTION ID:',
    confirmedPayment.transactionId,
  );

  console.log(
    'CONFIRMED PAID AT:',
    confirmedPayment.paidAt,
  );

  const persistedPayment =
    await prisma.payment.findUnique({
      where: {
        id: payment.id,
      },
    });

  if (!persistedPayment) {
    throw new Error(
      'Payment tidak ditemukan setelah confirmation.',
    );
  }

  if (persistedPayment.status !== 'PAID') {
    throw new Error(
      `Expected PAID, got ${persistedPayment.status}`,
    );
  }

  if (
    persistedPayment.transactionId !==
    transactionId
  ) {
    throw new Error(
      `transactionId tidak sesuai. Expected ${transactionId}, got ${persistedPayment.transactionId}`,
    );
  }

  if (!persistedPayment.paidAt) {
    throw new Error(
      'paidAt tidak tersimpan.',
    );
  }

  console.log(
    'STATUS PERSISTENCE: PASS',
  );

  console.log(
    'TRANSACTION ID PERSISTENCE: PASS',
  );

  console.log(
    'PAID AT PERSISTENCE: PASS',
  );

  console.log(
    '=== PAYMENT PERSISTENCE INTEGRITY TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== PAYMENT PERSISTENCE INTEGRITY TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });