import assert from "node:assert/strict";
import test from "node:test";
import { TestTokenVerifier } from "../src/auth/cognito.js";
import { readConfig, assertAwsRuntimeConfig } from "../src/config/env.js";
import { S3PrivateStorage } from "../src/storage/s3-storage.js";

test("expired and modified test tokens fail in test verifier", async () => {
  const verifier = new TestTokenVerifier();
  await assert.rejects(() => verifier.verify("expired"));
  await assert.rejects(() => verifier.verify("invalid"));
});

test("AWS mode cannot start with mock auth or memory repository", () => {
  const config = readConfig({
    BACKEND_RUNTIME_MODE: "aws",
    AUTH_MODE: "test",
    REPOSITORY_MODE: "memory",
    STORAGE_MODE: "local",
    AWS_REGION: "us-east-1",
    AWS_COGNITO_USER_POOL_ID: "pool",
    AWS_COGNITO_USER_POOL_CLIENT_ID: "client",
    AWS_AUDIO_BUCKET_NAME: "bucket",
    AWS_DATABASE_SECRET_ARN: "arn",
    AWS_DATABASE_ENDPOINT: "database.internal",
    AWS_WORK_QUEUE_URL: "queue",
    DATABASE_URL: "postgres://example",
  });

  assert.throws(() => assertAwsRuntimeConfig(config), /cannot start with mock/);
});

test("S3 storage rejects unsupported file types and oversize files before signing", () => {
  const storage = new S3PrivateStorage({ region: "us-east-1", bucketName: "private-test-bucket" });

  assert.throws(() => storage.validateFile({ mimeType: "text/html", sizeBytes: 100, extension: "html" }));
  assert.throws(() => storage.validateFile({ mimeType: "audio/mpeg", sizeBytes: 26 * 1024 * 1024, extension: "mp3" }));
  assert.doesNotThrow(() => storage.validateFile({ mimeType: "audio/mpeg", sizeBytes: 1024, extension: "mp3" }));
});
