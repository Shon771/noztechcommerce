import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { TelegramModule } from './modules/telegram/telegram.module';
import { DatabaseModule } from './database/database.module';
import { OrderModule } from './modules/order/order.module';
import { PromoModule } from './modules/promo/promo.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    OrderModule,
    TelegramModule,
    PromoModule,
    WhatsAppModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}