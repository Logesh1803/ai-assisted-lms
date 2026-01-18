export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export interface EmailProvider {
  send(payload: EmailPayload): Promise<void>;
}
