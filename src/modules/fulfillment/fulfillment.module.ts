import { Module, forwardRef } from '@nestjs/common';
import { DigitalFulfillmentService } from './digital-fulfillment.service';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [forwardRef(() => TelegramModule)],
  providers: [DigitalFulfillmentService],
  exports: [DigitalFulfillmentService],
})
export class FulfillmentModule {}