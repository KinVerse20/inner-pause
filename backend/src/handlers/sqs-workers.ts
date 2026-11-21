import { createRuntimeServices } from "../runtime/factory.js";
import type { PrivateDbActionResult } from "../internal/private-db-contract.js";
import { invokeLambdaJson } from "../runtime/lambda-invoke.js";
import { readSecretString } from "../runtime/secrets.js";
import { OpenAiProvider } from "../services/ai-provider.js";
import { DisabledAudioProvider } from "../services/audio-provider.js";
import { S3PrivateStorage } from "../storage/s3-storage.js";
import { AudioWorker } from "../workers/audio-worker.js";

interface SqsEvent {
  Records?: SqsRecord[];
}

interface SqsRecord {
  messageId: string;
  body?: string;
}

interface WorkerMessage {
  jobId?: string;
  userId?: string;
  type?: "journal_analysis" | "reset_audio" | "notification";
  journalId?: string;
  journalText?: string;
}

interface PartialBatchResponse {
  batchItemFailures: Array<{ itemIdentifier: string }>;
}

export async function analysisQueueHandler(event: SqsEvent): Promise<PartialBatchResponse> {
  return processBatch(event, "journal_analysis", processAnalysisMessage);
}

export async function audioQueueHandler(event: SqsEvent): Promise<PartialBatchResponse> {
  return processBatch(event, "reset_audio", processAudioMessage);
}

export async function notificationQueueHandler(event: SqsEvent): Promise<PartialBatchResponse> {
  return processBatch(event, "notification", processNotificationMessage);
}

async function processBatch(
  event: SqsEvent,
  expectedType: WorkerMessage["type"],
  processor: (message: RequiredWorkerMessage, messageId: string) => Promise<void>,
): Promise<PartialBatchResponse> {
  const failures: PartialBatchResponse["batchItemFailures"] = [];
  for (const record of event.Records ?? []) {
    try {
      const message = parseWorkerMessage(record.body);
      if (message.type !== expectedType) throw new Error(`Unexpected message type ${message.type ?? "unknown"}.`);
      const required = requireWorkerFields(message);
      console.info("Processing InnerPause worker message", {
        messageId: record.messageId,
        jobId: required.jobId,
        type: required.type,
      });
      await processor(required, record.messageId);
    } catch (error) {
      console.error("InnerPause worker message failed", {
        messageId: record.messageId,
        reason: error instanceof Error ? error.message : "Unknown worker failure.",
      });
      failures.push({ itemIdentifier: record.messageId });
    }
  }
  return { batchItemFailures: failures };
}

type RequiredWorkerMessage = WorkerMessage & { jobId: string; userId: string; type: "journal_analysis" | "reset_audio" | "notification" };

function parseWorkerMessage(body: string | undefined): WorkerMessage {
  if (!body) throw new Error("SQS message body is empty.");
  const parsed = JSON.parse(body) as WorkerMessage;
  if (!parsed || typeof parsed !== "object") throw new Error("SQS message body is invalid.");
  return parsed;
}

function requireWorkerFields(message: WorkerMessage): RequiredWorkerMessage {
  if (!message.jobId || !message.userId || !message.type) throw new Error("SQS worker message is missing required identifiers.");
  return message as RequiredWorkerMessage;
}

async function processAnalysisMessage(message: RequiredWorkerMessage, messageId: string) {
  if (!message.journalId) throw new Error("Analysis message is missing journalId.");
  if (!message.journalText) throw new Error("Analysis message is missing journalText.");
  const runtime = createRuntimeServices();
  const apiKey =
    runtime.config.openAiApiKey ??
    (runtime.config.openAiApiKeySecretArn && runtime.config.region
      ? await readSecretString({ region: runtime.config.region, secretArn: runtime.config.openAiApiKeySecretArn, jsonKey: "OPENAI_API_KEY" })
      : undefined);
  if (!apiKey) throw new Error("OPENAI_API_KEY or OPENAI_API_KEY_SECRET_ARN is required for analysis workers.");
  if (!runtime.config.region || !runtime.config.privateDbLambdaName) {
    throw new Error("Private database Lambda is not configured for analysis persistence.");
  }

  const aiProvider = new OpenAiProvider({ apiKey, model: runtime.config.openAiModel });
  try {
    const insight = await aiProvider.analyseJournal({ text: message.journalText, requestId: messageId });
    await invokeLambdaJson<PrivateDbActionResult>({
      functionName: runtime.config.privateDbLambdaName,
      region: runtime.config.region,
      payload: {
        action: "persistAnalysisResult",
        userId: message.userId,
        journalId: message.journalId,
        jobId: message.jobId,
        insight,
      },
    });
  } catch (error) {
    await invokeLambdaJson<PrivateDbActionResult>({
      functionName: runtime.config.privateDbLambdaName,
      region: runtime.config.region,
      payload: {
        action: "failJob",
        userId: message.userId,
        jobId: message.jobId,
        errorMessage: error instanceof Error ? error.message : "Analysis failed.",
      },
    }).catch(() => undefined);
    throw error;
  }
}

async function processAudioMessage(message: RequiredWorkerMessage) {
  if (!message.journalId) throw new Error("Audio message is missing journalId.");
  const runtime = createRuntimeServices();
  if (!runtime.config.region || !runtime.config.audioBucketName) throw new Error("Audio worker storage is not configured.");
  const worker = new AudioWorker(
    runtime.repository,
    new DisabledAudioProvider(),
    new S3PrivateStorage({ region: runtime.config.region, bucketName: runtime.config.audioBucketName }),
  );
  await worker.process({ userId: message.userId, jobId: message.jobId, journalId: message.journalId });
}

async function processNotificationMessage(message: RequiredWorkerMessage) {
  const runtime = createRuntimeServices();
  if (runtime.config.notificationsMode === "whatsapp" && !runtime.config.approvedTestRecipient) {
    throw new Error("Notification sending requires APPROVED_TEST_RECIPIENT.");
  }
  await runtime.repository.createNotification({
    userId: message.userId,
    messageText: "Scheduled InnerPause notification prepared for test delivery.",
    deliveryChannel: runtime.config.notificationsMode === "whatsapp" ? "meta_whatsapp" : "mock",
    deliveryStatus: runtime.config.notificationsMode === "disabled" ? "failed" : "queued",
    idempotencyKey: message.jobId,
    errorMessage: runtime.config.notificationsMode === "disabled" ? "Notifications are disabled for this AWS test environment." : undefined,
  });
}
