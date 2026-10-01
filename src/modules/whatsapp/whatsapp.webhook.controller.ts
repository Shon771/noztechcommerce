import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  Post,
  Query,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { WhatsAppInteractionService } from './whatsapp.interaction.service';

@Controller('whatsapp/webhook')
export class WhatsAppWebhookController {
  constructor(
    private readonly configService: ConfigService,
    private readonly interactionService: WhatsAppInteractionService,
  ) {}

  /**
   * Meta WhatsApp webhook verification.
   *
   * Meta akan mengirim:
   * hub.mode
   * hub.verify_token
   * hub.challenge
   */
  @Get()
  verifyWebhook(
    @Query() query: Record<string, string>,
  ): string {
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    const verifyToken =
      this.configService.get<string>(
        'WHATSAPP_VERIFY_TOKEN',
      ) ?? '';

    if (
      mode === 'subscribe' &&
      token === verifyToken &&
      challenge
    ) {
      return challenge;
    }

    throw new ForbiddenException('Forbidden');
  }

  /**
   * Incoming WhatsApp webhook.
   */
  @Post()
  @HttpCode(200)
  async receiveWebhook(
    @Body() payload: unknown,
  ): Promise<{ received: boolean }> {
    await this.interactionService.handleWebhook(
      payload,
    );

    return {
      received: true,
    };
  }
}