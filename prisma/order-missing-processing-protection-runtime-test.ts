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
    '=== 2J.22-C MISSING ORDER PROCESSING PROTECTION RUNTIME TEST ===',
  );

  const missingOrderId =
    '00000000-0000-4000-8000-000000000002';

  const orderService =
    new OrderService(
      prisma as any,
      new PromoService(prisma as any),
      new PaymentService(prisma as any),
    );

  const before =
    await prisma.order.findUnique({
      where: {
        id: missingOrderId,
      },
    });

  if (before) {
    throw new Error(
      'Test ID ternyata sudah digunakan oleh order.',
    );
  }

  console.log(
    'ORDER ID:',
    missingOrderId,
  );

  console.log(
    'ORDER EXISTS BEFORE:',
    'NO',
  );

  try {
    await orderService.processOrder(
      missingOrderId,
    );

    throw new Error(
      'processOrder() berhasil pada order yang tidak ada.',
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        'processOrder() berhasil pada order yang tidak ada.'
    ) {
      throw error;
    }

    console.log(
      'PROCESS ORDER REJECTED: PASS',
    );

    console.log(
      'ERROR:',
      error instanceof Error
        ? error.message
        : error,
    );
  }

  const after =
    await prisma.order.findUnique({
      where: {
        id: missingOrderId,
      },
    });

  if (after) {
    throw new Error(
      'Order tiba-tiba muncul setelah processOrder().',
    );
  }

  console.log(
    'ORDER EXISTS AFTER:',
    'NO',
  );

  console.log(
    'MISSING ORDER STATE PRESERVED: PASS',
  );

  console.log(
    '=== 2J.22-C RUNTIME TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.22-C RUNTIME TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });