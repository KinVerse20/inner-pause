# AWS Lambda packaging audit

Bundling method: CDK `NodejsFunction` with esbuild.

Runtime: Node.js 22, ARM64.

Source maps: enabled.

Minification: disabled, so first deployment debugging remains practical.

## API Gateway backend API

- Source entry file: `backend/src/handlers/api.ts`
- Handler export: `handler`
- Event type: API Gateway REST proxy event
- Trigger: `/health` and `/api/v1/{proxy+}`
- Required environment variables:
  - `BACKEND_RUNTIME_MODE=aws`
  - `AUTH_MODE=cognito`
  - `REPOSITORY_MODE=postgres`
  - `STORAGE_MODE=s3`
  - `AWS_REGION`
  - `AWS_COGNITO_USER_POOL_ID`
  - `AWS_COGNITO_USER_POOL_CLIENT_ID`
  - `AWS_AUDIO_BUCKET_NAME`
  - `AWS_DATABASE_PROXY_ENDPOINT`
  - `AWS_DATABASE_SECRET_ARN`
  - `DATABASE_NAME`
  - `DATABASE_USER`
  - `DATABASE_PORT`
  - `DATABASE_SSL=true`
  - `DATABASE_IAM_AUTH=true`
  - `AWS_ANALYSIS_QUEUE_URL`
  - `AWS_AUDIO_QUEUE_URL`
  - `AWS_NOTIFICATION_QUEUE_URL`
  - `ALLOWED_ORIGINS`
- Secrets: none read directly by API Lambda. Database access uses RDS Proxy IAM auth.
- Permissions:
  - RDS Proxy connect as `innerpause_admin`
  - send messages to analysis/audio/notification queues
  - read private S3 objects for signed audio playback support
  - CloudWatch logs
- Network: VPC private egress subnets, Lambda security group, RDS Proxy private access
- Timeout: 20 seconds
- Memory: 256 MB
- Current packaging status: bundled real backend API handler

## Analysis SQS worker

- Source entry file: `backend/src/handlers/sqs-workers.ts`
- Handler export: `analysisQueueHandler`
- Event type: SQS batch event
- Trigger: analysis queue
- Required environment variables: API variables plus `AI_MODE=openai`, `OPENAI_API_KEY_SECRET_ARN`, `OPENAI_MODEL`
- Secrets: reads `OPENAI_API_KEY` from Secrets Manager JSON
- Permissions:
  - consume analysis queue
  - read OpenAI secret
  - RDS Proxy connect as `innerpause_admin`
  - CloudWatch logs
- Network: VPC private egress subnets; needs outbound internet through NAT for OpenAI
- Timeout: 60 seconds
- Memory: 256 MB
- Partial batch failure: enabled
- Current packaging status: bundled real worker handler

## Audio SQS worker

- Source entry file: `backend/src/handlers/sqs-workers.ts`
- Handler export: `audioQueueHandler`
- Event type: SQS batch event
- Trigger: audio queue
- Required environment variables: API variables
- Secrets: none until a final audio provider is selected
- Permissions:
  - consume audio queue
  - write private S3 objects
  - RDS Proxy connect as `innerpause_admin`
  - CloudWatch logs
- Network: VPC private egress subnets
- Timeout: 120 seconds
- Memory: 512 MB
- Partial batch failure: enabled
- Current packaging status: bundled real worker handler, but provider is intentionally disabled and fails jobs clearly instead of creating fake audio

## Notification SQS worker

- Source entry file: `backend/src/handlers/sqs-workers.ts`
- Handler export: `notificationQueueHandler`
- Event type: SQS batch event
- Trigger: notification queue
- Required environment variables: API variables plus `NOTIFICATIONS_MODE`
- Secrets: none while notifications are disabled
- Permissions:
  - consume notification queue
  - RDS Proxy connect as `innerpause_admin`
  - CloudWatch logs
- Network: VPC private egress subnets
- Timeout: 45 seconds
- Memory: 256 MB
- Partial batch failure: enabled
- Current packaging status: bundled real worker handler; real sending remains disabled unless provider and approved test recipient are configured

## EventBridge schedule handler

- Source entry file: `backend/src/handlers/schedule.ts`
- Handler export: `handler`
- Event type: EventBridge scheduled event
- Trigger: daily EventBridge rule
- Required environment variables: API variables plus `NOTIFICATIONS_MODE`
- Secrets: none while notifications are disabled
- Permissions:
  - RDS Proxy connect as `innerpause_admin`
  - CloudWatch logs
- Network: VPC private egress subnets
- Timeout: 30 seconds
- Memory: 256 MB
- Current packaging status: bundled real handler. It is deployable and safe, but scheduled notification lookup is still deferred until notification preference delivery is tested.

## Migration/admin Lambdas

No migration or admin Lambda is packaged. Migrations remain an explicit local/operator command through `backend/scripts/run-migrations.mjs`.
