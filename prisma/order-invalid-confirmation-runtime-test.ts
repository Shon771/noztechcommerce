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
    '=== 2J.12-C INVALID ORDER ID PROTECTION TEST ===',
  );

  const invalidOrderId =
    '00000000-0000-0000-0000-000000000000';

  const orderService =
    new OrderService(
      prisma as any,
      new PromoService(prisma as any),
      new PaymentService(prisma as any),
    );

  const existingOrder =
    await prisma.order.findUnique({
      where: {
        id: invalidOrderId,
      },
    });

  if (existingOrder) {
    throw new Error(
      'Test order ID ternyata sudah digunakan.',
    );
  }

  console.log(
    'INVALID ORDER ID:',
    invalidOrderId,
  );

  console.log(
    'ORDER EXISTS BEFORE TEST:',
    'NO',
  );

  try {
    await orderService.confirmOrder(
      invalidOrderId,
    );

    console.log(
      'UNEXPECTED RESULT: confirmOrder() berhasil.',
    );

    throw new Error(
      'Invalid order ID berhasil dikonfirmasi.',
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        'Invalid order ID berhasil dikonfirmasi.'
    ) {
      throw error;
    }

    console.log(
      'CONFIRM ORDER REJECTED: PASS',
    );

    console.log(
      'ERROR:',
      error instanceof Error
        ? error.message
        : error,
    );

    if (
      error instanceof Error &&
      error.message !==
        'Pesanan tidak ditemukan.'
    ) {
      throw new Error(
        `Unexpected error message: ${error.message}`,
      );
    }

    console.log(
      'EXPECTED NOT FOUND ERROR: PASS',
    );
  }

  const orderAfter =
    await prisma.order.findUnique({
      where: {
        id: invalidOrderId,
      },
    });

  if (orderAfter) {
    throw new Error(
      'Invalid order ID menghasilkan record order.',
    );
  }

  console.log(
    'NO ORDER CREATED: PASS',
  );

  console.log(
    '=== 2J.12-C RUNTIME TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.12-C RUNTIME TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });