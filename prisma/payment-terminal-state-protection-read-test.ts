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
    '=== 2J.25-C PAYMENT TERMINAL STATE PROTECTION FINAL READ-BACK ===',
  );

  const fixtures = [
    {
      state: 'FAILED',
      orderId:
        '7c028d5b-a097-4701-8888-fa4a09eee14e',
      paymentId:
        '0e04fb1c-ff5e-45d9-a45e-3e9a9559cd8e',
    },
    {
      state: 'EXPIRED',
      orderId:
        '44ad9fe0-a025-4b9d-8d47-0e511e907f01',
      paymentId:
        '7f43e41c-35d0-4ec4-a9b4-eddd3a23a7be',
    },
    {
      state: 'REFUNDED',
      orderId:
        'fb7483cb-675e-473a-95aa-cb1044753b0a',
      paymentId:
        '08bfdb01-5958-4956-80a6-2921ade01b2c',
    },
  ] as const;

  for (const fixture of fixtures) {
    const payment =
      await prisma.payment.findUnique({
        where: {
          id: fixture.paymentId,
        },
      });

    if (!payment) {
      throw new Error(
        `${fixture.state} Payment fixture tidak ditemukan.`,
      );
    }

    if (payment.status !== fixture.state) {
      throw new Error(
        `${fixture.state} state berubah menjadi ${payment.status}.`,
      );
    }

    if (payment.orderId !== fixture.orderId) {
      throw new Error(
        `${fixture.state} Payment → Order relation berubah.`,
      );
    }

    console.log('');
    console.log(
      `--- ${fixture.state} FINAL STATE ---`,
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
      `${fixture.state} STATE PERSISTED: PASS`,
    );

    console.log(
      `${fixture.state} NOT PROMOTED TO PAID: PASS`,
    );

    console.log(
      `${fixture.state} PAYMENT → ORDER RELATION PRESERVED: PASS`,
    );
  }

  console.log('');

  console.log(
    'TERMINAL PAYMENT STATES PERSISTED: PASS',
  );

  console.log(
    'CONFIRMATION PROTECTION PERSISTED: PASS',
  );

  console.log(
    '=== 2J.25-C FINAL READ-BACK PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.25-C FINAL READ-BACK ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });