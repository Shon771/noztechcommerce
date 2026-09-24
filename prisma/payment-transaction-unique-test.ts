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
  console.log('=== PAYMENT TRANSACTION UNIQUE TEST ===');

  const customer =
    await prisma.customer.create({
      data: {
        name: '2J9 Transaction Unique Test',
        telegramId: `TEST-2J9-${Date.now()}`,
      },
    });

  const order1 =
    await prisma.order.create({
      data: {
        orderNumber: `NT-2J9-A-${Date.now()}`,
        status: 'PENDING',
        subtotal: 10000,
        shippingCost: 0,
        discount: 0,
        total: 10000,
        customerId: customer.id,
      },
    });

  const order2 =
    await prisma.order.create({
      data: {
        orderNumber: `NT-2J9-B-${Date.now()}`,
        status: 'PENDING',
        subtotal: 15000,
        shippingCost: 0,
        discount: 0,
        total: 15000,
        customerId: customer.id,
      },
    });

  const transactionId =
    `TEST-2J9-UNIQUE-${Date.now()}`;

  const payment1 =
    await prisma.payment.create({
      data: {
        orderId: order1.id,
        amount: 10000,
        method: 'COD',
        status: 'PAID',
        transactionId,
        paidAt: new Date(),
      },
    });

  console.log(
    'PAYMENT 1 ID:',
    payment1.id,
  );

  console.log(
    'TRANSACTION ID:',
    payment1.transactionId,
  );

  try {
    await prisma.payment.create({
      data: {
        orderId: order2.id,
        amount: 15000,
        method: 'COD',
        status: 'PAID',
        transactionId,
        paidAt: new Date(),
      },
    });

    throw new Error(
      'UNIQUE PROTECTION FAILED: duplicate transactionId berhasil dibuat.',
    );
  } catch (error: any) {
    if (
      error?.code === 'P2002'
    ) {
      console.log(
        'DUPLICATE TRANSACTION ID REJECTED: PASS',
      );
    } else {
      throw error;
    }
  }

  console.log(
    '=== PAYMENT TRANSACTION UNIQUE TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== PAYMENT TRANSACTION UNIQUE TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });