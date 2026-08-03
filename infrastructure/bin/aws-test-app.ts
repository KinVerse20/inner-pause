#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { InnerPauseAwsTestStack } from "../lib/inner-pause-aws-test-stack.js";

const app = new cdk.App();

new InnerPauseAwsTestStack(app, "InnerPauseAwsTestStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? "us-east-1",
  },
});

