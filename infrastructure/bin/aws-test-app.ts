#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { InnerPauseAwsTestStack } from "../lib/inner-pause-aws-test-stack.js";

const app = new cdk.App();
const expectedAccount = process.env.EXPECTED_AWS_ACCOUNT_ID;
const actualAccount = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION ?? process.env.AWS_REGION ?? "ap-south-1";
const environmentName = process.env.ENVIRONMENT_NAME ?? "test";

if (environmentName !== "test") {
  throw new Error(`Refusing to synthesize non-test environment "${environmentName}". This stack is only for the isolated AWS test environment.`);
}

if (expectedAccount && actualAccount && expectedAccount !== actualAccount) {
  throw new Error(`Refusing to synthesize for AWS account ${actualAccount}. EXPECTED_AWS_ACCOUNT_ID is ${expectedAccount}.`);
}

if (region !== "ap-south-1") {
  throw new Error(`Refusing to synthesize for region ${region}. The intended AWS test region is ap-south-1.`);
}

new InnerPauseAwsTestStack(app, "InnerPauseAwsTestStack", {
  env: {
    account: actualAccount,
    region,
  },
});
