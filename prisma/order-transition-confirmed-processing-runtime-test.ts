import 'dotenv/config';

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

import { OrderService } from '../src/modules/order/order.service';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log(
    '=== 2J.27-B ORDER TRANSITION CONFIRMED → PROCESSING RUNTIME TEST ===',
  );

  const orderId =
    '247855ba-b21c-4500-925e-3e4484f6fc20';

  const orderService =
    new OrderService(
      prisma as any,
      null as any,
      null as any,
    );

  const beforeOrder =
    await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

  if (!beforeOrder) {
    throw new Error(
      'Order fixture tidak ditemukan.',
    );
  }

  console.log(
    'ORDER STATUS BEFORE:',
    beforeOrder.status,
  );

  if (beforeOrder.status !== 'CONFIRMED') {
    throw new Error(
      `Order harus CONFIRMED sebelum transition, tetapi ${beforeOrder.status}.`,
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

  const afterOrder =
    await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

  if (!afterOrder) {
    throw new Error(
      'Order hilang setelah processing.',
    );
  }

  console.log(
    'ORDER STATUS AFTER:',
    afterOrder.status,
  );

  console.log(
    'ORDER ID AFTER:',
    afterOrder.id,
  );

  if (result.status !== 'PROCESSING') {
    throw new Error(
      `processOrder() menghasilkan ${result.status}, bukan PROCESSING.`,
    );
  }

  if (afterOrder.status !== 'PROCESSING') {
    throw new Error(
      `Order tidak tersimpan sebagai PROCESSING. Status: ${afterOrder.status}`,
    );
  }

  if (afterOrder.id !== orderId) {
    throw new Error(
      'Order ID berubah setelah transition.',
    );
  }

  console.log(
    'CONFIRMED → PROCESSING TRANSITION: PASS',
  );

  console.log(
    'ORDER ID PRESERVED: PASS',
  );

  console.log(
    'PROCESSING STATE PERSISTED: PASS',
  );

  console.log(
    '=== 2J.27-B RUNTIME TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.27-B RUNTIME TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });