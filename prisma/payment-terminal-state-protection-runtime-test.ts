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
    '=== 2J.25-C PAYMENT TERMINAL STATE PROTECTION RUNTIME TEST ===',
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

  const paymentService =
    new PaymentService(
      prisma as any,
    );

  for (const fixture of fixtures) {
    console.log('');
    console.log(
      `--- ${fixture.state} RUNTIME ---`,
    );

    const before =
      await prisma.payment.findUnique({
        where: {
          id: fixture.paymentId,
        },
      });

    if (!before) {
      throw new Error(
        `${fixture.state} Payment fixture tidak ditemukan.`,
      );
    }

    if (
      before.status !== fixture.state
    ) {
      throw new Error(
        `${fixture.state} sebelum runtime tidak sesuai.`,
      );
    }

    if (
      before.orderId !== fixture.orderId
    ) {
      throw new Error(
        `${fixture.state} Payment → Order relation tidak sesuai.`,
      );
    }

    console.log(
      'PAYMENT STATUS BEFORE:',
      before.status,
    );

    let rejected = false;

    try {
      await paymentService.confirmPayment(
        fixture.paymentId,
        `TX-2J25-C-${fixture.state}-${Date.now()}`,
      );
    } catch (error) {
      rejected = true;

      console.log(
        'CONFIRM PAYMENT REJECTED: PASS',
      );

      console.log(
        'ERROR TYPE:',
        error?.constructor?.name,
      );

      console.log(
        'ERROR:',
        error instanceof Error
          ? error.message
          : String(error),
      );
    }

    if (!rejected) {
      throw new Error(
        `${fixture.state} Payment berhasil dikonfirmasi padahal harus ditolak.`,
      );
    }

    const after =
      await prisma.payment.findUnique({
        where: {
          id: fixture.paymentId,
        },
      });

    if (!after) {
      throw new Error(
        `${fixture.state} Payment hilang setelah confirmation attempt.`,
      );
    }

    console.log(
      'PAYMENT STATUS AFTER:',
      after.status,
    );

    if (
      after.status !== fixture.state
    ) {
      throw new Error(
        `${fixture.state} berubah menjadi ${after.status}.`,
      );
    }

    if (
      after.orderId !== fixture.orderId
    ) {
      throw new Error(
        `${fixture.state} Payment → Order relation berubah.`,
      );
    }

    if (
      after.transactionId !==
      before.transactionId
    ) {
      throw new Error(
        `${fixture.state} transactionId berubah.`,
      );
    }

    if (
      after.paidAt?.getTime() !==
      before.paidAt?.getTime()
    ) {
      throw new Error(
        `${fixture.state} paidAt berubah.`,
      );
    }

    console.log(
      `${fixture.state} STATE PRESERVED: PASS`,
    );

    console.log(
      `${fixture.state} NOT PROMOTED TO PAID: PASS`,
    );

    console.log(
      `${fixture.state} PAYMENT → ORDER RELATION PRESERVED: PASS`,
    );

    console.log(
      `${fixture.state} TRANSACTION STATE PRESERVED: PASS`,
    );
  }

  console.log('');
  console.log(
    '=== 2J.25-C RUNTIME TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.25-C RUNTIME TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });