import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InteractionRouter } from './interaction.router';
import { TelegramService } from './telegram.service';

@Injectable()
export class TelegramUpdateService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(
    TelegramUpdateService.name,
  );

  private running = false;
  private offset = 0;

  constructor(
    private readonly telegramService: TelegramService,
    private readonly interactionRouter: InteractionRouter,
  ) {}

  onModuleInit(): void {
  const pollingEnabled =
    process.env.TELEGRAM_POLLING_ENABLED !== 'false';

  if (!pollingEnabled) {
    this.logger.warn(
      'Telegram polling disabled by TELEGRAM_POLLING_ENABLED.',
    );
    return;
  }

  this.running = true;

  this.logger.log(
    'Telegram update engine starting...',
  );

  void this.poll();
}

  onModuleDestroy(): void {
    this.running = false;

    this.logger.log(
      'Telegram update engine stopped.',
    );
  }

  private async poll(): Promise<void> {
    while (this.running) {
      try {
        const response =
          await this.telegramService.getUpdates(
            this.offset,
          );

        if (!response.ok) {
          this.logger.error(
            `Telegram API error: ${
              response.description ?? 'Unknown error'
            }`,
          );

          await this.sleep(3000);
          continue;
        }

        for (const update of response.result) {
          this.logger.log(
            `Telegram update received: ${update.update_id}`,
          );

          if (update.callback_query) {
            this.logger.log(
              `Telegram callback update detected: ${
                update.callback_query.data ??
                'NO_DATA'
              }`,
            );
          }

          this.offset = update.update_id + 1;

          await this.interactionRouter.route(
            update,
          );
        }
      } catch (error) {
  if (error instanceof Error) {
    const axiosError = error as Error & {
      response?: {
        status?: number;
        data?: {
          ok?: boolean;
          description?: string;
        };
      };
    };

    const telegramStatus =
      axiosError.response?.status;

    const telegramDescription =
      axiosError.response?.data?.description;

    this.logger.error(
      `Telegram polling error: ${error.message}` +
        `${telegramStatus ? ` | HTTP ${telegramStatus}` : ''}` +
        `${telegramDescription ? ` | ${telegramDescription}` : ''}`,
      error.stack,
    );
  } else {
    this.logger.error(
      `Telegram polling error: ${String(error)}`,
    );
  }

  await this.sleep(3000);
}
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) =>
      setTimeout(resolve, ms),
    );
  }
}