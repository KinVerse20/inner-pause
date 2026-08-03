# AWS account setup audit

## Stack

- CDK app entrypoint: `infrastructure/bin/aws-test-app.ts`
- Stack name: `InnerPauseAwsTestStack`
- Environment label: `test`
- Production naming guard: CDK app refuses any `ENVIRONMENT_NAME` other than `test`

## Expected region

- Intended region: `ap-south-1`
- Reason: Mumbai region, closer to Sahil and appropriate for the first AWS test review
- Current CDK default: `ap-south-1`
- CDK app refuses synth when the selected region is not `ap-south-1`

## Expected AWS account source

The AWS account ID is not hardcoded in source code.

CDK uses the account discovered by the AWS CLI/CDK environment:

- `CDK_DEFAULT_ACCOUNT`

Optional safety variable:

- `EXPECTED_AWS_ACCOUNT_ID`

If `EXPECTED_AWS_ACCOUNT_ID` is set and the active AWS account differs, CDK synth/diff stops.

## Bootstrap requirements

CDK bootstrap must run once per AWS account and region before deploying CDK assets.

Reviewed target format:

```bash
npx cdk bootstrap aws://ACCOUNT_ID/ap-south-1
```

Use the safe helper:

```bash
npm run bootstrap:safe
```

The helper verifies identity first and requires typed confirmation.

## Diff command

Use:

```bash
npm run diff:safe
```

This verifies identity, builds infrastructure, synthesizes CDK, runs `cdk diff`, and saves output to:

```text
.aws-review/cdk-diff.txt
```

## Bootstrap resources

CDK bootstrap may create supporting resources such as:

- `CDKToolkit` CloudFormation stack
- S3 asset bucket
- ECR repository if required by future assets
- IAM roles used by CDK deployments
- SSM parameter for bootstrap version

These are not The InnerPause application resources.

## Unsafe or incomplete scripts found

- Existing `npm --prefix infrastructure run deploy` still exists and runs `cdk deploy --all`. Do not use it during account review.
- Existing `npm --prefix infrastructure run diff` is non-deploying but does not verify identity first.
- New safe wrappers are available:
  - `npm run aws:verify`
  - `npm run bootstrap:safe`
  - `npm run diff:safe`

