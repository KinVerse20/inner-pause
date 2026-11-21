# AWS Admin Control Room setup

## What was built

This branch adds a first-version Admin Control Room for the AWS test version of The Inner Pause.

It includes:

- `/admin` frontend route in the standalone AWS frontend.
- Protected backend routes under `/api/v1/admin/*`.
- Cognito group-based admin authorization.
- Read-only dashboard sections for:
  - overview
  - complete app test status
  - CloudWatch alerts
  - AWS costs and budget status
  - suspicious login activity
  - database health
  - API usage and rate-limit status
  - file-upload/S3 security
  - security status
  - user privacy tests
  - backup status
- A throttled `Run Complete Test` endpoint.
- Documentation for wiring the real Playwright runner through GitHub Actions or a dedicated test runner.

No destructive admin action was added.

## How admin access works

Admin access uses Cognito group membership.

The configured admin group is:

```text
InnerPauseAdmins
```

The backend verifies the Cognito JWT and checks the `cognito:groups` claim. A normal signed-in user can still load the frontend route if they type `/admin`, but the backend returns `403 Forbidden`, so no admin data is shown.

The frontend is only a convenience layer. Real protection is enforced by the backend.

## How to create the first admin user

After deployment:

1. Create or confirm a Cognito user in the AWS test User Pool.
2. Verify the user email.
3. Add that user to the group:

```text
InnerPauseAdmins
```

AWS Console path:

```text
Cognito → User pools → ap-south-1_lUYwsiWWp → Users → select user → Add user to group
```

CLI equivalent:

```bash
aws --profile inner-pause --region ap-south-1 cognito-idp admin-add-user-to-group \
  --user-pool-id ap-south-1_lUYwsiWWp \
  --username "<admin-user-email-or-username>" \
  --group-name InnerPauseAdmins
```

Use only approved admin users.

## Required IAM permissions

The API Lambda needs read-only permissions for admin dashboard data:

- `cloudwatch:DescribeAlarms`
- `cloudwatch:GetMetricStatistics`
- `cloudwatch:ListMetrics`
- `ce:GetCostAndUsage`
- `rds:DescribeDBInstances`
- `rds:DescribeDBSnapshots`
- `cognito-idp:ListUsers`
- `sqs:GetQueueAttributes`
- `s3:GetBucketPublicAccessBlock`
- `s3:GetBucketPolicyStatus`
- `s3:ListBucket`
- `access-analyzer:ListFindings`
- `backup:ListRecoveryPointsByBackupVault`

Some AWS APIs only support `Resource: *` for read/list calls. No `AdministratorAccess` is required or added.

## Required AWS APIs

The dashboard reads from:

- CloudWatch
- Cost Explorer
- RDS
- Cognito
- SQS
- S3
- IAM Access Analyzer
- AWS Backup

It does not expose AWS credentials or secret values to the browser.

## How the full-app test button works

The first version does not run Playwright inside Lambda.

Reason:

- Browser-based Playwright is too heavy for the existing API Lambda.
- Running it in the browser would expose implementation details and would not be secure.

Current behavior:

- Admin can click `Run Complete Test`.
- Backend verifies admin group membership.
- Backend rate-limits repeated requests.
- Backend returns a safe `blocked` status explaining that runner dispatch is not configured.

Recommended production-safe implementation:

1. Create a GitHub Actions workflow that runs:

```bash
npm --prefix frontend run test:e2e
```

2. Store AWS test app URL and test-user credentials as GitHub Actions secrets.
3. Add a backend job dispatcher that calls GitHub workflow dispatch.
4. Store results in a small database table or S3 JSON object.
5. Show report links and screenshot links in the admin dashboard.

Do not store GitHub tokens in frontend code.

## Extra AWS cost

Expected extra cost for this first version:

- Cognito group: no direct extra cost.
- Additional Lambda execution time for admin reads: low, usage-based.
- Cost Explorer API calls: may have AWS Cost Explorer API charges depending on account usage.
- CloudWatch/RDS/S3/SQS read API calls: low, usage-based.
- Cognito Threat Protection is not enabled by this change. Enabling it manually can add cost.
- A future dedicated Playwright runner could add GitHub Actions minutes, ECS/Fargate, CodeBuild or Lambda container cost.

## Manual setup still required

- Deploy the CDK changes after review.
- Add the first approved user to the `InnerPauseAdmins` Cognito group.
- Ensure Amplify has the AWS frontend environment variables configured.
- Configure Cognito callback/logout URLs for the Amplify branch.
- Configure a GitHub Actions or dedicated runner workflow before expecting the `Run Complete Test` button to run Playwright.
- Enable Cognito Threat Protection manually if suspicious login findings are required.
- Configure IAM Access Analyzer in the account if findings are expected.
- Replace the generated OpenAI test secret value before real analysis testing.

## How to deploy safely

Do not deploy until `cdk diff` has been reviewed.

Suggested commands:

```bash
git status
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix frontend run test
npm --prefix backend run build
npm --prefix backend run test
npm --prefix infrastructure run build
AWS_REGION=ap-south-1 CDK_DEFAULT_REGION=ap-south-1 npm --prefix infrastructure run synth
AWS_REGION=ap-south-1 CDK_DEFAULT_REGION=ap-south-1 npm --prefix infrastructure run diff
```

Only after review:

```bash
AWS_REGION=ap-south-1 CDK_DEFAULT_REGION=ap-south-1 npm --prefix infrastructure run deploy
```

This task does not deploy automatically.

## Rollback

If deployment causes issues:

1. Revert the commit.
2. Run CDK diff.
3. Deploy the reverted stack only after confirming no data resources are being deleted.

Do not delete the RDS database, S3 bucket, Cognito User Pool or Secrets Manager secrets manually.

## Security notes

- No admin endpoint returns AWS keys, database passwords, OpenAI keys or secret values.
- The frontend redacts suspicious key names before displaying raw section JSON.
- Backend admin routes log admin route access and test-run requests.
- Admin actions are read-only in this first version.
- The complete test button is throttled and currently blocked until a safe runner is configured.

