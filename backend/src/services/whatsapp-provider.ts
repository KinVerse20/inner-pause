export interface NotificationProvider {
  sendTestMessage(input: { to: string; message: string; idempotencyKey?: string }): Promise<{ providerMessageId?: string; status: "sent" | "disabled" }>;
}

export class DisabledNotificationProvider implements NotificationProvider {
  async sendTestMessage(): Promise<{ status: "disabled" }> {
    return { status: "disabled" };
  }
}

export class SafeMockNotificationProvider implements NotificationProvider {
  constructor(private readonly approvedRecipient?: string) {}

  async sendTestMessage(input: { to: string; message: string }) {
    if (!this.approvedRecipient || input.to !== this.approvedRecipient) {
      return { status: "disabled" as const };
    }
    return { status: "sent" as const, providerMessageId: `mock-${crypto.randomUUID()}` };
  }
}

