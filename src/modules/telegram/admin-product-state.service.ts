import {
  Injectable,
  Logger,
} from '@nestjs/common';

export type AdminProductStep =
  | 'name'
  | 'price'
  | 'description'
  | 'photo'
  | 'category'
  | 'stock'
  | 'confirm'
  | 'edit-name'
  | 'edit-price'
  | 'edit-description'
 | 'edit-category'
| 'edit-stock';

export interface AdminProductState {
  step: AdminProductStep;
  productId?: string;
  name?: string;
  price?: number;
  description?: string;
  photoFileId?: string;
  categoryId?: string;
  stock?: number;
}

@Injectable()
export class AdminProductStateService {
  private readonly logger =
    new Logger(
      AdminProductStateService.name,
    );

  private readonly states = new Map<
    string,
    AdminProductState
  >();

  start(
    telegramUserId: string,
  ): void {
    this.states.set(
      telegramUserId,
      {
        step: 'name',
      },
    );
  }

  get(
    telegramUserId: string,
  ): AdminProductState | undefined {
    const state =
      this.states.get(telegramUserId);

    this.logger.warn(
      `ADMIN STATE GET | ${telegramUserId} | ${JSON.stringify(state)}`,
    );

    return state;
  }

  set(
    telegramUserId: string,
    state: AdminProductState,
  ): void {
    this.logger.warn(
      `ADMIN STATE SET | ${telegramUserId} | ${JSON.stringify(state)}`,
    );

    this.states.set(
      telegramUserId,
      state,
    );
  }

  clear(
    telegramUserId: string,
  ): void {
    this.states.delete(
      telegramUserId,
    );
  }
}