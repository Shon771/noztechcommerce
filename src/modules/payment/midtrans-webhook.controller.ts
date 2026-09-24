import {
  Body,
  Controller,
  HttpCode,
  Post,
} from '@nestjs/common';

import { MidtransWebhookService } from './midtrans-webhook.service';

@Controller('payment')
export class MidtransWebhookController {
  constructor(
    private readonly midtransWebhookService: MidtransWebhookService,
  ) {}

  @Post('midtrans/webhook')
  @HttpCode(200)
  async handleWebhook(@Body() body: any) {
    return this.midtransWebhookService.handleNotification(
      body,
    );
  }
}