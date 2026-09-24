import { Module, forwardRef } from '@nestjs/common';

import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { AdminOrderController } from './admin-order.controller';

import { PromoModule } from '../promo/promo.module';
import { PaymentModule } from '../payment/payment.module';
import { CustomerModule } from '../customer/customer.module';
import { CartModule } from '../cart/cart.module';

@Module({
  imports: [
    PromoModule,
    forwardRef(() => PaymentModule),
    CustomerModule,
    CartModule,
  ],

  controllers: [
    OrderController,
    AdminOrderController,
  ],

  providers: [
    OrderService,
  ],

  exports: [
    OrderService,
  ],
})
export class OrderModule {}