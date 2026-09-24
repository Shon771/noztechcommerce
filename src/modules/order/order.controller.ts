import {
  BadRequestException,
  Controller,
  Post,
  Query,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CustomerService } from '../customer/customer.service';
import { CartService } from '../cart/cart.service';
import type { PaymentMethod } from '../payment/payment.service';

@Controller('order')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly customerService: CustomerService,
    private readonly cartService: CartService,
  ) {}

  @Post('test-checkout')
  async testCheckout(
    @Query('telegramId') telegramId?: string,
    @Query('productId') productId?: string,
    @Query('method') method?: string,
  ) {
    if (!telegramId) {
      throw new BadRequestException(
        'telegramId wajib diisi.',
      );
    }

    if (!productId) {
      throw new BadRequestException(
        'productId wajib diisi.',
      );
    }

    const paymentMethod =
      (method ?? 'COD') as PaymentMethod;

    const allowedMethods: PaymentMethod[] = [
      'CASH',
      'BANK_TRANSFER',
      'E_WALLET',
      'QRIS',
      'COD',
    ];

    if (
      !allowedMethods.includes(
        paymentMethod,
      )
    ) {
      throw new BadRequestException(
        `Payment method tidak valid. Gunakan: ${allowedMethods.join(
          ', ',
        )}`,
      );
    }

    const customer =
      await this.customerService.findOrCreateByTelegram(
        telegramId,
        'Runtime Test Customer',
        'runtime_test',
      );

    await this.cartService.addItem(
      customer.id,
      productId,
    );

    const result =
      await this.orderService.createFromCart(
        customer.id,
        undefined,
        paymentMethod,
      );

    return {
      success: true,
      message:
        'Runtime checkout berhasil.',
      order: {
        id: result.id,
        orderNumber:
          result.orderNumber,
        status: result.status,
        subtotal: result.subtotal,
        shippingCost:
          result.shippingCost,
        discount: result.discount,
        total: result.total,
      },
      payment: {
        id: result.payment.id,
        orderId:
          result.payment.orderId,
        method:
          result.payment.method,
        status:
          result.payment.status,
        amount:
          result.payment.amount,
      },
    };
  }
}