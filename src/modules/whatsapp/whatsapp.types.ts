/**
 * WhatsApp Cloud API
 * Shared TypeScript types for webhook payloads
 * and outbound interactive messages.
 */

/* =========================================================
 * WEBHOOK - INBOUND
 * ======================================================= */

export interface WhatsAppWebhookPayload {
  object?: string;
  entry?: WhatsAppWebhookEntry[];
}

export interface WhatsAppWebhookEntry {
  id?: string;
  changes?: WhatsAppWebhookChange[];
}

export interface WhatsAppWebhookChange {
  field?: string;
  value?: WhatsAppWebhookValue;
}

export interface WhatsAppWebhookValue {
  messaging_product?: 'whatsapp' | string;

  metadata?: {
    display_phone_number?: string;
    phone_number_id?: string;
  };

  contacts?: WhatsAppContact[];

  messages?: WhatsAppInboundMessage[];

  statuses?: WhatsAppMessageStatus[];
}

export interface WhatsAppContact {
  profile?: {
    name?: string;
  };

  wa_id?: string;
}

/* =========================================================
 * INBOUND MESSAGE
 * ======================================================= */

export type WhatsAppMessageType =
  | 'text'
  | 'interactive'
  | 'image'
  | 'audio'
  | 'video'
  | 'document'
  | 'sticker'
  | 'location'
  | 'contacts'
  | 'reaction'
  | 'button'
  | string;

export interface WhatsAppInboundMessage {
  from?: string;
  id?: string;
  timestamp?: string;
  type?: WhatsAppMessageType;

  text?: {
    body?: string;
  };

  interactive?: WhatsAppInteractiveReply;

  button?: {
    text?: string;
    payload?: string;
  };
}

/* =========================================================
 * INTERACTIVE REPLY
 * ======================================================= */

export type WhatsAppInteractiveReplyType =
  | 'button_reply'
  | 'list_reply'
  | string;

export interface WhatsAppInteractiveReply {
  type?: WhatsAppInteractiveReplyType;

  button_reply?: {
    id?: string;
    title?: string;
  };

  list_reply?: {
    id?: string;
    title?: string;
    description?: string;
  };
}

/* =========================================================
 * MESSAGE STATUS
 * ======================================================= */

export interface WhatsAppMessageStatus {
  id?: string;
  status?: string;
  timestamp?: string;
  recipient_id?: string;

  errors?: Array<{
    code?: number;
    title?: string;
    message?: string;
  }>;
}

/* =========================================================
 * OUTBOUND - TEXT
 * ======================================================= */

export interface WhatsAppSendTextRequest {
  messaging_product: 'whatsapp';
  recipient_type?: 'individual';
  to: string;
  type: 'text';

  text: {
    preview_url?: boolean;
    body: string;
  };
}

/* =========================================================
 * OUTBOUND - INTERACTIVE LIST
 * ======================================================= */

export interface WhatsAppListRow {
  id: string;
  title: string;
  description?: string;
}

export interface WhatsAppListSection {
  title?: string;
  rows: WhatsAppListRow[];
}

export interface WhatsAppSendListRequest {
  messaging_product: 'whatsapp';
  recipient_type?: 'individual';
  to: string;
  type: 'interactive';

  interactive: {
    type: 'list';

    header?: {
      type: 'text';
      text: string;
    };

    body: {
      text: string;
    };

    footer?: {
      text: string;
    };

    action: {
      button: string;
      sections: WhatsAppListSection[];
    };
  };
}

/* =========================================================
 * OUTBOUND - REPLY BUTTONS
 * ======================================================= */

export interface WhatsAppReplyButton {
  type: 'reply';

  reply: {
    id: string;
    title: string;
  };
}

export interface WhatsAppSendButtonsRequest {
  messaging_product: 'whatsapp';
  recipient_type?: 'individual';
  to: string;
  type: 'interactive';

  interactive: {
    type: 'button';

    body: {
      text: string;
    };

    footer?: {
      text: string;
    };

    action: {
      buttons: WhatsAppReplyButton[];
    };
  };
}

/* =========================================================
 * OUTBOUND - IMAGE
 * ======================================================= */

export interface WhatsAppSendImageRequest {
  messaging_product: 'whatsapp';
  recipient_type?: 'individual';
  to: string;
  type: 'image';

  image: {
    link: string;
    caption?: string;
  };
}

/* =========================================================
 * INTERNAL BOT CONTEXT
 * ======================================================= */

export interface WhatsAppUserContext {
  phoneNumber: string;
  name?: string;
}

/* =========================================================
 * CATALOG STATE
 * ======================================================= */

export interface WhatsAppCatalogState {
  page: number;
  productIds: string[];
}

/* =========================================================
 * CHECKOUT STATE
 * ======================================================= */

export interface WhatsAppCheckoutState {
  waitingForPromo: boolean;
  promoCode?: string;
  paymentMethod?: string;
}