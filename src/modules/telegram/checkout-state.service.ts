import { Injectable } from '@nestjs/common';
import { PaymentMethod } from '../payment/payment.service';

interface CheckoutState {
  waitingForPromo: boolean;
  promoCode?: string;
  paymentMethod?: PaymentMethod;
}

@Injectable()
export class CheckoutStateService {
  private readonly states = new Map<
    string,
    CheckoutState
  >();

  setWaitingForPromo(
    telegramUserId: string,
  ): void {
    const currentState =
      this.states.get(telegramUserId);

    this.states.set(telegramUserId, {
      ...currentState,
      waitingForPromo: true,
    });
  }

  setPromoCode(
    telegramUserId: string,
    promoCode: string,
  ): void {
    const currentState =
      this.states.get(telegramUserId);

    this.states.set(telegramUserId, {
      ...currentState,
      waitingForPromo: false,
      promoCode,
    });
  }

  setPaymentMethod(
    telegramUserId: string,
    paymentMethod: PaymentMethod,
  ): void {
    const currentState =
      this.states.get(telegramUserId);

    this.states.set(telegramUserId, {
      ...currentState,
      waitingForPromo:
        currentState?.waitingForPromo ?? false,
      paymentMethod,
    });
  }

  getState(
    telegramUserId: string,
  ): CheckoutState | undefined {
    return this.states.get(telegramUserId);
  }

  clear(
    telegramUserId: string,
  ): void {
    this.states.delete(telegramUserId);
  }
}