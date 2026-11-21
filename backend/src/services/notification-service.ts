import type { NotificationMessage } from "@innerpause/shared";

export class NotificationService {
  list(): NotificationMessage[] {
    return [];
  }

  createTest() {
    return { queued: true };
  }
}

