import assert from "node:assert/strict";
import test from "node:test";
import { handler as apiHandler } from "../src/handlers/api.js";
import { handler as publicApiHandler } from "../src/handlers/public-api.js";
import { audioQueueHandler, analysisQueueHandler, notificationQueueHandler } from "../src/handlers/sqs-workers.js";
import { handler as scheduleHandler } from "../src/handlers/schedule.js";

test("API Lambda handler returns a valid API Gateway response shape", async () => {
  const response = await apiHandler({
    httpMethod: "GET",
    path: "/health",
    headers: { origin: "http://localhost:3000", "x-request-id": "lambda-api-test" },
    body: null,
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.headers["x-request-id"], "lambda-api-test");
  assert.equal(response.headers["access-control-allow-origin"], "http://localhost:3000");
  assert.match(response.body, /innerpause-backend/);
});

test("authenticated GET /api/v1/me accepts API Gateway Cognito claims", async () => {
  const response = await apiHandler({
    httpMethod: "GET",
    path: "/api/v1/me",
    headers: { origin: "http://localhost:3000", "x-request-id": "lambda-me-test" },
    requestContext: { authorizer: { claims: { sub: "user-1", email: "user@example.com" } } },
    body: null,
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.headers["access-control-allow-origin"], "http://localhost:3000");
});

test("public API Lambda 401 and 403 responses include CORS headers", async () => {
  const headers = { origin: "http://localhost:3000", "x-request-id": "lambda-public-error-test" };
  const unauthorised = await publicApiHandler({
    httpMethod: "POST",
    path: "/api/v1/analysis/quick",
    headers,
    body: JSON.stringify({ text: "A test reflection" }),
  });
  const forbidden = await publicApiHandler({
    httpMethod: "GET",
    path: "/api/v1/admin/overview",
    headers,
    requestContext: { authorizer: { claims: { sub: "user-1", email: "user@example.com" } } },
    body: null,
  });

  assert.equal(unauthorised.statusCode, 401);
  assert.equal(unauthorised.headers["access-control-allow-origin"], "http://localhost:3000");
  assert.equal(forbidden.statusCode, 403);
  assert.equal(forbidden.headers["access-control-allow-origin"], "http://localhost:3000");
});

test("SQS Lambda handlers return partial batch failure format", async () => {
  const event = {
    Records: [
      {
        messageId: "bad-message",
        body: JSON.stringify({ type: "journal_analysis", jobId: "job-1" }),
      },
    ],
  };

  const analysis = await analysisQueueHandler(event);
  const audio = await audioQueueHandler({ Records: [{ messageId: "wrong-audio", body: JSON.stringify({ type: "journal_analysis", jobId: "job-2", userId: "user-1" }) }] });
  const notification = await notificationQueueHandler({
    Records: [{ messageId: "wrong-notification", body: JSON.stringify({ type: "reset_audio", jobId: "job-3", userId: "user-1" }) }],
  });

  assert.deepEqual(analysis, { batchItemFailures: [{ itemIdentifier: "bad-message" }] });
  assert.deepEqual(audio, { batchItemFailures: [{ itemIdentifier: "wrong-audio" }] });
  assert.deepEqual(notification, { batchItemFailures: [{ itemIdentifier: "wrong-notification" }] });
});

test("schedule Lambda handler imports and returns a safe disabled-mode result", async () => {
  const response = await scheduleHandler({
    id: "schedule-test",
    time: new Date(0).toISOString(),
    source: "aws.events",
    "detail-type": "Scheduled Event",
  });

  assert.equal(response.queued, 0);
  assert.match(response.skipped, /disabled|not enabled/i);
});
