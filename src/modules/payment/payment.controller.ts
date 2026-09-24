import {
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  PaymentConfirmationService,
} from './payment-confirmation.service';

import { AdminApiKeyGuard } from '../order/admin-api-key.guards';
import {
  DigitalFulfillmentService,
} from '../fulfillment/digital-fulfillment.service';


@UseGuards(AdminApiKeyGuard)
@Controller('payment')
export class PaymentController {
  constructor(
  private readonly paymentConfirmationService: PaymentConfirmationService,
  private readonly digitalFulfillmentService: DigitalFulfillmentService,
) {}
  @Post('confirm')
async confirmPayment(
  @Body()
  body: {
    paymentId: string;
    transactionId?: string;
  },
) {
  const result =
    await this.paymentConfirmationService.confirm(
      body.paymentId,
      body.transactionId,
    );

  if (!result.idempotent) {
    await this.digitalFulfillmentService
      .deliverDigitalProductsForOrder(
        result.order.orderNumber,
      );
  }

  return result;
}

}