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
    '=== 2J.12-A PENDING CONFIRMATION REGRESSION RUNTIME TEST ===',
  );

  const orderId =
    '2fd4c865-e88d-488e-838d-bc4ae7a9a153';

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

  if (before.status !== 'PENDING') {
    throw new Error(
      `Expected PENDING, got ${before.status}`,
    );
  }

  const result =
    await orderService.confirmOrder(
      orderId,
    );

  console.log(
    'CONFIRM ORDER RESULT:',
    result.status,
  );

  if (result.status !== 'CONFIRMED') {
    throw new Error(
      `Expected CONFIRMED, got ${result.status}`,
    );
  }

  console.log(
    'PENDING → CONFIRMED: PASS',
  );

  const after =
    await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

  if (!after) {
    throw new Error(
      'Order tidak ditemukan setelah confirmation.',
    );
  }

  console.log(
    'ORDER STATUS AFTER:',
    after.status,
  );

  if (after.status !== 'CONFIRMED') {
    throw new Error(
      `Order tidak tersimpan sebagai CONFIRMED. Got ${after.status}`,
    );
  }

  console.log(
    'CONFIRMED STATE PERSISTENCE: PASS',
  );

  console.log(
    '=== 2J.12-A RUNTIME REGRESSION PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.12-A RUNTIME REGRESSION ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });