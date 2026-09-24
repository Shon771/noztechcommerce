import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { TelegramUpdateService } from './telegram-update.service';
import { InteractionRouter } from './interaction.router';
import { CallbackRouter } from './callback.router';
import { StartHandler } from './handlers/start.handler';
import { MainMenuHandler } from './handlers/main-menu.handler';
import { ProductModule } from '../product/product.module';
import { CustomerModule } from '../customer/customer.module';
import { CartModule } from '../cart/cart.module';
import { OrderModule } from '../order/order.module';
import { CheckoutStateService } from './checkout-state.service';
import { PromoModule } from '../promo/promo.module';
import { AdminHandler } from './handlers/admin.handler';
import { AdminProductStateService } from './admin-product-state.service';
import { AdminAccessService } from './admin-access.service';
import { PaymentModule } from '../payment/payment.module';
@Module({
  imports: [
  HttpModule,
  ProductModule,
  CustomerModule,
  CartModule,
  OrderModule,
  PromoModule,
  forwardRef(() => PaymentModule),
],
  controllers: [TelegramController],
  providers: [
    TelegramService,
    TelegramUpdateService,
    InteractionRouter,
    CallbackRouter,
    StartHandler,
    MainMenuHandler,
    AdminHandler,
    CheckoutStateService,
    AdminProductStateService,
    AdminAccessService,
  ],
  exports: [TelegramService],
})
export class TelegramModule {}