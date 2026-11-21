import assert from "node:assert/strict";
import test from "node:test";

const { readFrontendConfig } = await import("../lib/config/env.ts");

test("reads required AWS frontend public environment variables", () => {
  const config = readFrontendConfig({
    NEXT_PUBLIC_API_BASE_URL: "https://api.example.test/test",
    NEXT_PUBLIC_APP_URL: "https://app.example.test",
    NEXT_PUBLIC_AWS_REGION: "ap-south-1",
    NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID: "ap-south-1_example",
    NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID: "client-id",
  });

  assert.deepEqual(config, {
    apiBaseUrl: "https://api.example.test/test",
    appUrl: "https://app.example.test",
    awsRegion: "ap-south-1",
    cognitoUserPoolId: "ap-south-1_example",
    cognitoClientId: "client-id",
  });
});

test("fails clearly when the API base URL is missing", () => {
  assert.throws(
    () => readFrontendConfig({}),
    /NEXT_PUBLIC_API_BASE_URL is required for the separated frontend/,
  );
});
