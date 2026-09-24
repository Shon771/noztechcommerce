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
    '=== 2J.27-G ORDER TRANSITION PENDING → CANCELLED RUNTIME TEST ===',
  );

  const orderId =
    '6481d61e-9db9-41b1-bdf4-eedbecc40d7f';

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

  if (beforeOrder.status !== 'PENDING') {
    throw new Error(
      `Order harus PENDING sebelum cancellation, tetapi ${beforeOrder.status}.`,
    );
  }

  const result =
    await orderService.cancelOrder(
      orderId,
    );

  console.log(
    'CANCEL ORDER RESULT:',
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
      'Order hilang setelah cancellation.',
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

  if (result.status !== 'CANCELLED') {
    throw new Error(
      `cancelOrder() menghasilkan ${result.status}, bukan CANCELLED.`,
    );
  }

  if (afterOrder.status !== 'CANCELLED') {
    throw new Error(
      `Order tidak tersimpan sebagai CANCELLED. Status: ${afterOrder.status}`,
    );
  }

  if (afterOrder.id !== orderId) {
    throw new Error(
      'Order ID berubah setelah cancellation.',
    );
  }

  console.log(
    'PENDING → CANCELLED TRANSITION: PASS',
  );

  console.log(
    'ORDER ID PRESERVED: PASS',
  );

  console.log(
    'CANCELLED STATE PERSISTED: PASS',
  );

  console.log(
    '=== 2J.27-G RUNTIME TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.27-G RUNTIME TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });