import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { WhatsAppService } from './whatsapp.service';
import { WhatsAppWebhookController } from './whatsapp.webhook.controller';
import { WhatsAppInteractionService } from './whatsapp.interaction.service';

@Module({
  imports: [ConfigModule],

  controllers: [
    WhatsAppWebhookController,
  ],

  providers: [
    WhatsAppService,
    WhatsAppInteractionService,
  ],

  exports: [
    WhatsAppService,
  ],
})
export class WhatsAppModule {}