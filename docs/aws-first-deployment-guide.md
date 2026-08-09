# The InnerPause AWS first deployment guide

This guide is for the first isolated AWS test deployment. Do not use production user data.

## 1. Create a safe AWS deployment identity

Create a dedicated IAM user or IAM Identity Center permission set for this test app. Do not use a personal root account.

Minimum access needed for the first CDK deployment is access to CloudFormation, CDK bootstrap assets, Lambda, API Gateway, Cognito, RDS, RDS Proxy, EC2 networking, S3, SQS, EventBridge, Secrets Manager, CloudWatch Logs, CloudWatch Alarms and Amplify.

Do not attach broad access permanently. Use a temporary deployment role if possible.

## 2. Configure AWS CLI

```bash
aws configure sso
aws sts get-caller-identity
```

Confirm the account ID and region are the intended AWS test account.

## 3. Bootstrap CDK

```bash
cd "/Users/sahil/Documents/Healing App/infrastructure"
npm install
npx cdk bootstrap
```

## 4. Review the CDK diff

```bash
npm run diff
```

Review resources that cost money: VPC NAT Gateway, RDS PostgreSQL, RDS Proxy, Lambda, S3, SQS, CloudWatch Logs and Amplify.

## 5. Deploy the infrastructure

```bash
npm run deploy
```

Save the CDK outputs. They do not contain secret values.

## 6. Add Secrets Manager values

After deployment, open AWS Secrets Manager and add required external-service values if they are not already managed:

- `OPENAI_API_KEY`
- Optional WhatsApp provider credentials, only for an approved test recipient

Never paste secrets into frontend environment variables.

## 7. Run database migrations

After the RDS proxy endpoint and database connection string are available:

```bash
cd "/Users/sahil/Documents/Healing App/backend"
DATABASE_URL="postgres://USER:PASSWORD@HOST:5432/innerpause_test" \
DATABASE_SSL=true \
AWS_TEST_MIGRATIONS_CONFIRM=run-aws-test-migrations \
npm run migrate:aws:test
```

The migration runner prints only the target host and database. It refuses production-looking hosts unless explicitly approved.

## 8. Connect GitHub to Amplify

In AWS Amplify, connect the repository and choose the AWS test branch. Enter only public frontend variables:

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_AWS_REGION`
- `NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID`
- `NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID`
- `NEXT_PUBLIC_APP_URL`

## 9. Backend Lambda environment values

Backend Lambdas need:

- `BACKEND_RUNTIME_MODE=aws`
- `AUTH_MODE=cognito`
- `REPOSITORY_MODE=postgres`
- `STORAGE_MODE=s3`
- `AI_MODE=openai`
- `NOTIFICATIONS_MODE=disabled` or a configured test mode
- `AWS_REGION`
- `AWS_COGNITO_USER_POOL_ID`
- `AWS_COGNITO_USER_POOL_CLIENT_ID`
- `AWS_AUDIO_BUCKET_NAME`
- `AWS_DATABASE_SECRET_ARN`
- `AWS_DATABASE_ENDPOINT`
- `AWS_PRIVATE_DB_LAMBDA_NAME`
- `AWS_ANALYSIS_QUEUE_URL`
- `AWS_AUDIO_QUEUE_URL`
- `AWS_NOTIFICATION_QUEUE_URL`
- `DATABASE_NAME`
- `OPENAI_MODEL`

Secrets belong in Secrets Manager, not outputs or frontend variables.

## 10. Create a Cognito test user

Use the app sign-up screen or Cognito console. Use a fake test email you control. Verify the email before signing in.

## 11. Test journals

Create a fake journal entry only. Confirm:

- `/api/v1/me` returns the current user.
- Journal creation succeeds.
- Journal details can be read by the same user.
- A second user cannot read the first user’s journal.

## 12. Test emotional insight

Create an analysis job from a fake journal entry, then check:

- Job status moves from `queued` to `processing` to `completed` or `failed`.
- CloudWatch does not log journal text.
- Completed analysis appears on the journal detail.
- Failed analysis keeps the journal.

## 13. Test audio

Audio generation remains blocked until a final provider is selected. The worker should fail cleanly and mark the job failed rather than creating fake audio in AWS mode.

## 14. View CloudWatch errors

Open CloudWatch Logs for:

- API Lambda
- Analysis worker Lambda
- Audio worker Lambda
- Notification worker Lambda

Search by request ID, message ID or job ID. Do not log secrets or journal content.

## 15. Verify S3 and RDS are private

Confirm:

- S3 bucket has Block Public Access enabled.
- RDS has `publiclyAccessible=false`.
- RDS is in isolated/private subnets.
- Lambdas use the VPC security group.

## 16. Roll back safely

To roll back code, redeploy the previous known-good commit.

To delete AWS test resources and stop charges:

```bash
cd "/Users/sahil/Documents/Healing App/infrastructure"
npm run destroy
```

The audio S3 bucket uses retain policy. Empty and delete it manually only after confirming no needed test files remain.
