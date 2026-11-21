import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";

export interface QueueMessage {
  jobId: string;
  userId: string;
  type: "journal_analysis" | "reset_audio" | "notification";
  journalId?: string;
  journalText?: string;
}

export interface QueueClient {
  enqueue(message: QueueMessage, idempotencyKey?: string): Promise<void>;
}

export class SqsQueueClient implements QueueClient {
  private readonly client: SQSClient;

  constructor(
    private readonly input: {
      region: string;
      queueUrl?: string;
      analysisQueueUrl?: string;
      audioQueueUrl?: string;
      notificationQueueUrl?: string;
    },
  ) {
    this.client = new SQSClient({ region: input.region });
  }

  async enqueue(message: QueueMessage, idempotencyKey?: string) {
    const queueUrl = this.queueUrlFor(message);
    await this.client.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
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

  private queueUrlFor(message: QueueMessage) {
    const queueUrl =
      message.type === "journal_analysis"
        ? this.input.analysisQueueUrl
        : message.type === "reset_audio"
          ? this.input.audioQueueUrl
          : this.input.notificationQueueUrl;
    const fallback = queueUrl ?? this.input.queueUrl;
    if (!fallback) throw new Error(`No SQS queue URL configured for ${message.type}.`);
    return fallback;
  }
}

export class NoopQueueClient implements QueueClient {
  readonly messages: QueueMessage[] = [];

  async enqueue(message: QueueMessage) {
    this.messages.push(message);
  }
}
