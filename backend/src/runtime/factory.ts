import { CognitoJwtVerifier, TestTokenVerifier, type TokenVerifier } from "../auth/cognito.js";
import { readConfig, assertAwsRuntimeConfig, type BackendConfig } from "../config/env.js";
import { InMemoryRepository } from "../repositories/in-memory.js";
import { PostgresRepository } from "../repositories/postgres.js";
import type { AppRepository } from "../repositories/types.js";
import { NoopQueueClient, SqsQueueClient, type QueueClient } from "../jobs/sqs-queue.js";

export interface RuntimeServices {
  config: BackendConfig;
  repository: AppRepository;
  verifier: TokenVerifier;
  queue: QueueClient;
}

export function createRuntimeServices(env = process.env): RuntimeServices {
  const config = readConfig(env);
  if (config.runtimeMode === "aws") assertAwsRuntimeConfig(config);

  const repository =
    config.repositoryMode === "postgres"
      ? new PostgresRepository({
          connectionString: config.databaseUrl,
          host: config.databaseUrl ? undefined : config.databaseProxyEndpoint,
          database: env.DATABASE_NAME,
          user: env.DATABASE_USER,
          password: env.DATABASE_PASSWORD,
          ssl: config.databaseSsl || config.runtimeMode === "aws",
        })
      : createMemoryRepository(config);

  const verifier =
    config.authMode === "cognito"
      ? new CognitoJwtVerifier(config)
      : config.runtimeMode === "aws"
        ? failAwsMock("AUTH_MODE=test")
        : new TestTokenVerifier();

  const queue =
    config.region && (config.analysisQueueUrl || config.audioQueueUrl || config.notificationQueueUrl || config.workQueueUrl)
      ? new SqsQueueClient({
          region: config.region,
          queueUrl: config.workQueueUrl,
          analysisQueueUrl: config.analysisQueueUrl,
          audioQueueUrl: config.audioQueueUrl,
          notificationQueueUrl: config.notificationQueueUrl,
        })
      : config.runtimeMode === "aws"
        ? failAwsMock("missing AWS queue URLs")
        : new NoopQueueClient();

  return { config, repository, verifier, queue };
}

function createMemoryRepository(config: BackendConfig): AppRepository {
  if (config.runtimeMode === "aws") return failAwsMock("REPOSITORY_MODE=memory");
  return new InMemoryRepository();
}

function failAwsMock(reason: string): never {
  throw new Error(`Unsafe AWS runtime configuration: ${reason} is not allowed.`);
}
