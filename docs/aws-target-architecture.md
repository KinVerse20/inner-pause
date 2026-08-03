# AWS full-stack test target architecture

This document describes a separate AWS test environment for The InnerPause. It is intentionally isolated from the existing Vercel and Supabase production setup.

## Goals

- Build a safe AWS test stack without touching production.
- Keep the current Next.js UI and product flow intact.
- Introduce provider boundaries so Supabase can remain active while AWS services are tested.
- Support future cutover decisions with rollback and comparison documentation.

## Provider switch

Runtime provider selection is controlled by:

```text
INFRASTRUCTURE_PROVIDER=supabase | aws
```

Default behavior remains `supabase` when the variable is absent.

The AWS provider is scaffolded for test use only. It does not remove or replace Supabase production behavior.

## Proposed AWS services

### Frontend

- AWS Amplify Hosting for a test deployment of the Next.js app.
- Separate environment variables from Vercel.
- No production domain cutover during this branch.

### Auth

- Amazon Cognito User Pool.
- Fresh test users only.
- No production Supabase user migration until a separate migration plan is approved.

### Database

- Amazon RDS PostgreSQL in private subnets.
- RDS Proxy for Lambda connection pooling.
- Secrets Manager for generated database credentials.
- AWS-compatible migrations under `infrastructure/database`.

### Storage

- Private Amazon S3 bucket for future audio or user asset storage.
- Block public access enabled.
- Server-generated signed URLs for private objects.
- Existing local audio files remain available in this branch.

### API and backend jobs

- API Gateway in front of Lambda handlers.
- Lambda functions for health checks and future analysis/session APIs.
- SQS queue and dead-letter queue for async work.
- EventBridge schedule for future morning guidance jobs.
- CloudWatch logs and alarms.

### Security

- Least-privilege IAM policies.
- No service-role or database secrets in browser code.
- Resource tagging for environment separation.
- Test resources tagged with `Environment=test`.

## High-level flow

```text
Amplify Next.js app
  -> Cognito hosted/session auth for AWS test users
  -> API Gateway
  -> Lambda handlers
  -> RDS Proxy
  -> RDS PostgreSQL

Lambda jobs
  -> SQS / EventBridge
  -> RDS Proxy
  -> S3 signed URL generation
```

## Isolation rules

- Do not reuse production Supabase tables for AWS testing.
- Do not reuse production Vercel environment variables inside Amplify.
- Do not automatically migrate real users.
- Do not deploy AWS resources from CI without explicit approval.

## Estimated cost controls for test

- Use small RDS instance classes for test.
- Keep one NAT gateway at most, or avoid NAT where possible for isolated tests.
- Set CloudWatch retention to one month.
- Add AWS Budgets manually before long-running tests.
- Destroy test stacks when they are no longer needed.

## Rollback model

Rollback is simple because production remains on Vercel/Supabase:

1. Keep production DNS unchanged.
2. Keep Vercel environment unchanged.
3. Keep `INFRASTRUCTURE_PROVIDER=supabase` for production.
4. Destroy AWS test stacks if necessary.

