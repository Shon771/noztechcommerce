import { Module, forwardRef } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentConfirmationService } from './payment-confirmation.service';
import { PaymentController } from './payment.controller';
import { MidtransPaymentService } from './midtrans-payment.service';
import { OrderModule } from '../order/order.module';
import { MidtransWebhookController } from './midtrans-webhook.controller';
import { MidtransWebhookService } from './midtrans-webhook.service';
import { FulfillmentModule } from '../fulfillment/fulfillment.module';

@Module({
  imports: [
    forwardRef(() => OrderModule),
    forwardRef(() => FulfillmentModule),
  ],
  controllers: [PaymentController, MidtransWebhookController],
  providers: [
  PaymentService,
  PaymentConfirmationService,
  MidtransPaymentService,
  MidtransWebhookService,
],
  exports: [
    PaymentService,
    PaymentConfirmationService,
    MidtransPaymentService,
  ],
})
export class PaymentModule {}