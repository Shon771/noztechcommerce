import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CustomerService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findOrCreateByTelegram(
    telegramId: string,
    firstName?: string,
    username?: string,
  ) {
    const existingCustomer =
      await this.prisma.customer.findFirst({
        where: {
          telegramId,
        },
      });

    if (existingCustomer) {
      return existingCustomer;
    }

    return this.prisma.customer.create({
      data: {
        telegramId,
        name: firstName || 'Telegram Customer',
        telegramUsername: username ?? null,
      },
    });
  }
}