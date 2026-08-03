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
  databaseUrl?: string;
  databaseSsl: boolean;
  approvedTestRecipient?: string;
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
    databaseUrl: env.DATABASE_URL,
    databaseSsl: env.DATABASE_SSL === "true",
    approvedTestRecipient: env.APPROVED_TEST_RECIPIENT,
  };
}

export function assertAwsRuntimeConfig(config = readConfig()) {
  if (config.runtimeMode === "aws") {
    const unsafe = [
      ["AUTH_MODE", config.authMode, "cognito"],
      ["REPOSITORY_MODE", config.repositoryMode, "postgres"],
      ["STORAGE_MODE", config.storageMode, "s3"],
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
    ["AWS_WORK_QUEUE_URL", config.workQueueUrl],
    ["DATABASE_URL or AWS_DATABASE_PROXY_ENDPOINT", config.databaseUrl ?? config.databaseProxyEndpoint],
  ].filter(([, value]) => !value);

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
