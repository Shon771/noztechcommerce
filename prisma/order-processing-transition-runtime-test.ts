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
    '=== 2J.13-A ORDER PROCESSING TRANSITION RUNTIME TEST ===',
  );

  const orderId =
    '7f93f836-efe2-4b6c-a010-72b75d7f9ad4';

  const orderService =
    new OrderService(
      prisma as any,
      new PromoService(prisma as any),
      new PaymentService(prisma as any),
    );

  const before =
    await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

  if (!before) {
    throw new Error(
      'Order tidak ditemukan.',
    );
  }

  console.log(
    'ORDER ID:',
    before.id,
  );

  console.log(
    'ORDER NUMBER:',
    before.orderNumber,
  );

  console.log(
    'ORDER STATUS BEFORE:',
    before.status,
  );

  if (before.status !== 'CONFIRMED') {
    throw new Error(
      `Expected CONFIRMED, got ${before.status}`,
    );
  }

  const result =
    await orderService.processOrder(
      orderId,
    );

  console.log(
    'PROCESS ORDER RESULT:',
    result.status,
  );

  if (result.status !== 'PROCESSING') {
    throw new Error(
      `Expected PROCESSING, got ${result.status}`,
    );
  }

  console.log(
    'CONFIRMED → PROCESSING: PASS',
  );

  const after =
    await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

  if (!after) {
    throw new Error(
      'Order tidak ditemukan setelah processing.',
    );
  }

  console.log(
    'ORDER STATUS AFTER:',
    after.status,
  );

  if (after.status !== 'PROCESSING') {
    throw new Error(
      `Order tidak tersimpan sebagai PROCESSING. Got ${after.status}`,
    );
  }

  console.log(
    'PROCESSING STATE PERSISTENCE: PASS',
  );

  console.log(
    '=== 2J.13-A RUNTIME TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.13-A RUNTIME TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });