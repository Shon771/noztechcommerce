import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean {
    const request = context
      .switchToHttp()
      .getRequest();

    const providedKey =
      request.headers['x-admin-key'];

    const adminKey =
      this.configService.get<string>(
        'ADMIN_API_KEY',
      );

    if (
      !adminKey ||
      typeof providedKey !== 'string' ||
      providedKey !== adminKey
    ) {
      throw new UnauthorizedException(
        'Invalid or missing admin API key',
      );
    }

    return true;
  }
}