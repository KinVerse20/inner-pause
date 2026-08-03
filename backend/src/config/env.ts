import { validationError } from "../shared/errors.js";

export interface BackendConfig {
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
}

export function readConfig(env = process.env): BackendConfig {
  return {
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
  };
}

export function assertAwsRuntimeConfig(config = readConfig()) {
  const missing = [
    ["AWS_REGION", config.region],
    ["AWS_COGNITO_USER_POOL_ID", config.cognitoUserPoolId],
    ["AWS_COGNITO_USER_POOL_CLIENT_ID", config.cognitoClientId],
    ["AWS_AUDIO_BUCKET_NAME", config.audioBucketName],
    ["AWS_DATABASE_SECRET_ARN", config.databaseSecretArn],
    ["AWS_DATABASE_PROXY_ENDPOINT", config.databaseProxyEndpoint],
    ["AWS_WORK_QUEUE_URL", config.workQueueUrl],
  ].filter(([, value]) => !value);

  if (missing.length) {
    throw validationError("Backend AWS environment is incomplete.", {
      missing: missing.map(([name]) => name),
    });
  }
}

