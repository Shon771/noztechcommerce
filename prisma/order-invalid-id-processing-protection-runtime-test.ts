import 'dotenv/config';

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

import { OrderService } from '../src/modules/order/order.service';
import { PromoService } from '../src/modules/promo/promo.service';
import { PaymentService } from '../src/modules/payment/payment.service';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log(
    '=== 2J.23-C INVALID ORDER ID PROCESSING PROTECTION RUNTIME TEST ===',
  );

  const invalidOrderId =
    'not-a-valid-order-id-process';

  const orderService =
    new OrderService(
      prisma as any,
      new PromoService(prisma as any),
      new PaymentService(prisma as any),
    );

  console.log(
    'ORDER ID:',
    invalidOrderId,
  );

  try {
    await orderService.processOrder(
      invalidOrderId,
    );

    throw new Error(
      'processOrder() berhasil menggunakan ID yang tidak valid.',
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        'processOrder() berhasil menggunakan ID yang tidak valid.'
    ) {
      throw error;
    }

    console.log(
      'PROCESS ORDER REJECTED: PASS',
    );

    console.log(
      'ERROR TYPE:',
      error?.constructor?.name ??
        typeof error,
    );

    console.log(
      'ERROR:',
      error instanceof Error
        ? error.message
        : error,
    );
  }

  console.log(
    'INVALID ID SAFETY CHECK: PASS',
  );

  console.log(
    '=== 2J.23-C RUNTIME TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.23-C RUNTIME TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });