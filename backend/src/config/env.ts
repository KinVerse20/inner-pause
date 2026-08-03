import { validationError } from "../shared/errors.js";

export interface BackendConfig {
  runtimeMode: "aws" | "local" | "test";
  authMode: "cognito" | "test";
  repositoryMode: "postgres" | "memory";
  storageMode: "s3" | "local";
  aiMode: "openai" | "mock" | "disabled";
  notificationsMode: "whatsapp" | "mock" | "disabled";
  port: number;
  apiBasePath: string;
  allowedOrigins: string[];
  region?: string;
  cognitoUserPoolId?: string;
  cognitoClientId?: string;
  audioBucketName?: string;
  databaseSecretArn?: string;
  databaseProxyEndpoint?: string;
  workQueueUrl?: string;
  analysisQueueUrl?: string;
  audioQueueUrl?: string;
  notificationQueueUrl?: string;
  databaseUrl?: string;
  databaseSsl: boolean;
  databaseName?: string;
  databaseUser?: string;
  databasePassword?: string;
  databasePort: number;
  databaseIamAuth: boolean;
  approvedTestRecipient?: string;
  openAiApiKey?: string;
  openAiApiKeySecretArn?: string;
  openAiModel: string;
}

export function readConfig(env = process.env): BackendConfig {
  return {
    runtimeMode: parseEnum(env.BACKEND_RUNTIME_MODE, ["aws", "local", "test"], "local"),
    authMode: parseEnum(env.AUTH_MODE, ["cognito", "test"], "test"),
    repositoryMode: parseEnum(env.REPOSITORY_MODE, ["postgres", "memory"], "memory"),
    storageMode: parseEnum(env.STORAGE_MODE, ["s3", "local"], "local"),
    aiMode: parseEnum(env.AI_MODE, ["openai", "mock", "disabled"], "disabled"),
    notificationsMode: parseEnum(env.NOTIFICATIONS_MODE, ["whatsapp", "mock", "disabled"], "disabled"),
    port: Number(env.PORT ?? 4000),
    apiBasePath: env.API_BASE_PATH ?? "/api/v1",
    allowedOrigins: (env.ALLOWED_ORIGINS ?? "http://localhost:3000")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    region: env.AWS_REGION,
    cognitoUserPoolId: env.AWS_COGNITO_USER_POOL_ID,
    cognitoClientId: env.AWS_COGNITO_USER_POOL_CLIENT_ID,
    audioBucketName: env.AWS_AUDIO_BUCKET_NAME,
    databaseSecretArn: env.AWS_DATABASE_SECRET_ARN,
    databaseProxyEndpoint: env.AWS_DATABASE_PROXY_ENDPOINT,
    workQueueUrl: env.AWS_WORK_QUEUE_URL,
    analysisQueueUrl: env.AWS_ANALYSIS_QUEUE_URL,
    audioQueueUrl: env.AWS_AUDIO_QUEUE_URL,
    notificationQueueUrl: env.AWS_NOTIFICATION_QUEUE_URL,
    databaseUrl: env.DATABASE_URL,
    databaseSsl: env.DATABASE_SSL === "true",
    databaseName: env.DATABASE_NAME,
    databaseUser: env.DATABASE_USER,
    databasePassword: env.DATABASE_PASSWORD,
    databasePort: Number(env.DATABASE_PORT ?? 5432),
    databaseIamAuth: env.DATABASE_IAM_AUTH === "true",
    approvedTestRecipient: env.APPROVED_TEST_RECIPIENT,
    openAiApiKey: env.OPENAI_API_KEY,
    openAiApiKeySecretArn: env.OPENAI_API_KEY_SECRET_ARN,
    openAiModel: env.OPENAI_MODEL ?? "gpt-4.1-mini",
  };
}

export function assertAwsRuntimeConfig(config = readConfig()) {
  if (config.runtimeMode === "aws") {
    const unsafe = [
      ["AUTH_MODE", config.authMode, "cognito"],
      ["REPOSITORY_MODE", config.repositoryMode, "postgres"],
      ["STORAGE_MODE", config.storageMode, "s3"],
      ["AI_MODE", config.aiMode, "openai"],
    ].filter(([, actual, expected]) => actual !== expected);

    if (unsafe.length) {
      throw validationError("AWS mode cannot start with mock, test or in-memory services.", {
        unsafe: unsafe.map(([name, actual, expected]) => ({ name, actual, expected })),
      });
    }
  }

  const missing = [
    ["AWS_REGION", config.region],
    ["AWS_COGNITO_USER_POOL_ID", config.cognitoUserPoolId],
    ["AWS_COGNITO_USER_POOL_CLIENT_ID", config.cognitoClientId],
    ["AWS_AUDIO_BUCKET_NAME", config.audioBucketName],
    ["AWS_DATABASE_SECRET_ARN", config.databaseSecretArn],
    ["AWS_DATABASE_PROXY_ENDPOINT", config.databaseProxyEndpoint],
    ["AWS_ANALYSIS_QUEUE_URL", config.analysisQueueUrl],
    ["AWS_AUDIO_QUEUE_URL", config.audioQueueUrl],
    ["AWS_NOTIFICATION_QUEUE_URL", config.notificationQueueUrl],
    ["DATABASE_URL or AWS_DATABASE_PROXY_ENDPOINT", config.databaseUrl ?? config.databaseProxyEndpoint],
    ["DATABASE_NAME", config.databaseUrl ? "not-required" : config.databaseName],
    ["DATABASE_USER", config.databaseUrl ? "not-required" : config.databaseUser],
    ["OPENAI_API_KEY or OPENAI_API_KEY_SECRET_ARN", config.aiMode === "openai" ? config.openAiApiKey ?? config.openAiApiKeySecretArn : "not-required"],
  ].filter(([, value]) => !value);

  if (config.notificationsMode === "whatsapp" && !config.approvedTestRecipient) {
    missing.push(["APPROVED_TEST_RECIPIENT", undefined]);
  }

  if (missing.length) {
    throw validationError("Backend AWS environment is incomplete.", {
      missing: missing.map(([name]) => name),
    });
  }
}

function parseEnum<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  if (!value) return fallback;
  if ((allowed as readonly string[]).includes(value)) return value as T;
  throw validationError(`Invalid environment value "${value}".`, { allowed: [...allowed] });
}
