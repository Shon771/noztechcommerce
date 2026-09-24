import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { OrderService } from '../src/modules/order/order.service';

async function main() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });

  const prisma = new PrismaClient({
    adapter,
  });

  const orderService =
    new OrderService(prisma as any);

  try {
    console.log('=== ORDER CREATE TEST ===');

    const customer =
      await prisma.customer.findUnique({
        where: {
          telegramId: 'TEST-TELEGRAM-001',
        },
      });

    if (!customer) {
      throw new Error(
        'Test customer tidak ditemukan.',
      );
    }

    const product =
      await prisma.product.findUnique({
        where: {
          sku: 'NTC-BERAS-001',
        },
      });

    if (!product) {
      throw new Error(
        'Test product tidak ditemukan.',
      );
    }

    let cart =
      await prisma.cart.findUnique({
        where: {
          customerId: customer.id,
        },
      });

    if (!cart) {
      cart =
        await prisma.cart.create({
          data: {
            customerId: customer.id,
          },
        });
    }

    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
      },
    });

    const testQuantity = 2;

    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product.id,
        quantity: testQuantity,
      },
    });

    console.log(
      'CART ITEM CREATED:',
      testQuantity,
    );

    const order =
      await orderService.createFromCart(
        customer.id,
      );

    console.log(
      'ORDER NUMBER:',
      order.orderNumber,
    );

    console.log(
      'ORDER STATUS:',
      order.status,
    );

    console.log(
      'ORDER SUBTOTAL:',
      order.subtotal.toString(),
    );

    console.log(
      'ORDER TOTAL:',
      order.total.toString(),
    );

    console.log(
      'ORDER ITEM COUNT:',
      order.items.length,
    );

    if (
      order.status !== 'PENDING'
    ) {
      throw new Error(
        'Order status bukan PENDING.',
      );
    }

    if (
      order.items.length !== 1
    ) {
      throw new Error(
        'Jumlah OrderItem tidak sesuai.',
      );
    }

    const orderItem =
      order.items[0];

    if (
      orderItem.quantity !==
      testQuantity
    ) {
      throw new Error(
        'Quantity OrderItem tidak sesuai.',
      );
    }

    if (
      Number(orderItem.unitPrice) !==
      Number(product.price)
    ) {
      throw new Error(
        'Unit price OrderItem tidak sesuai.',
      );
    }

    const expectedSubtotal =
      Number(product.price) *
      testQuantity;

    if (
      Number(order.subtotal) !==
      expectedSubtotal
    ) {
      throw new Error(
        'Subtotal Order tidak sesuai.',
      );
    }

    if (
      Number(order.total) !==
      expectedSubtotal
    ) {
      throw new Error(
        'Total Order tidak sesuai.',
      );
    }

    const remainingCartItems =
      await prisma.cartItem.findMany({
        where: {
          cartId: cart.id,
        },
      });

    console.log(
      'REMAINING CART ITEMS:',
      remainingCartItems.length,
    );

    if (
      remainingCartItems.length !== 0
    ) {
      throw new Error(
        'Cart masih memiliki item setelah checkout.',
      );
    }

    const savedOrder =
      await prisma.order.findUnique({
        where: {
          id: order.id,
        },
        include: {
          items: true,
        },
      });

    if (!savedOrder) {
      throw new Error(
        'Order tidak ditemukan setelah dibuat.',
      );
    }

    console.log(
      'SAVED ORDER VERIFIED: YES',
    );

    console.log(
      '=== ORDER CREATE TEST PASS ===',
    );
  } catch (error) {
    console.error(
      '=== ORDER CREATE TEST ERROR ===',
    );

    console.error(error);

    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();