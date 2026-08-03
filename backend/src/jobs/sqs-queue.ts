import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";

export interface QueueMessage {
  jobId: string;
  userId: string;
  type: "journal_analysis" | "reset_audio" | "notification";
  journalId?: string;
}

export interface QueueClient {
  enqueue(message: QueueMessage, idempotencyKey?: string): Promise<void>;
}

export class SqsQueueClient implements QueueClient {
  private readonly client: SQSClient;

  constructor(
    private readonly input: {
      region: string;
      queueUrl: string;
    },
  ) {
    this.client = new SQSClient({ region: input.region });
  }

  async enqueue(message: QueueMessage, idempotencyKey?: string) {
    await this.client.send(
      new SendMessageCommand({
        QueueUrl: this.input.queueUrl,
        MessageBody: JSON.stringify({
          ...message,
          createdAt: new Date().toISOString(),
        }),
        MessageAttributes: {
          jobType: { DataType: "String", StringValue: message.type },
          ...(idempotencyKey ? { idempotencyKey: { DataType: "String", StringValue: idempotencyKey } } : {}),
        },
      }),
    );
  }
}

export class NoopQueueClient implements QueueClient {
  readonly messages: QueueMessage[] = [];

  async enqueue(message: QueueMessage) {
    this.messages.push(message);
  }
}

