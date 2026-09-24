import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminAccessService {
  constructor(
    private readonly configService: ConfigService,
  ) {}

  isAdmin(
    telegramUserId: number,
  ): boolean {
    const adminIds =
      this.configService
        .get<string>('TELEGRAM_ADMIN_IDS')
        ?.split(',')
        .map((id) => id.trim())
        .filter(Boolean) ?? [];

    return adminIds.includes(
      String(telegramUserId),
    );
  }
}