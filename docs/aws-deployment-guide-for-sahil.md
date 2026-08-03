# AWS test deployment guide for Sahil

This guide is for a separate AWS test version of The InnerPause. Do not use it to modify the current Vercel/Supabase production app.

## Current safety state

- Safe production snapshot tag: `pre-aws-migration-safe`
- AWS test branch: `feature/aws-full-stack-test`
- Production provider default: `supabase`

## Local preparation

Install root app dependencies:

```bash
npm install
```

Install CDK dependencies:

```bash
npm --prefix infrastructure install
```

Run local checks:

```bash
npm run lint
npm run build
npm --prefix infrastructure run synth
```

## AWS prerequisites

Before any AWS deployment:

- Use a non-production AWS account or clearly isolated test account.
- Configure AWS CLI credentials locally.
- Create an AWS Budget alert manually.
- Confirm region, account id and stack names.
- Confirm no Vercel or Supabase production variables are being reused accidentally.

## Environment variables for AWS test

Use `.env.aws.example` as the template. Minimum values for the test app:

```text
INFRASTRUCTURE_PROVIDER=aws
NEXT_PUBLIC_APP_URL=https://your-amplify-test-domain.example
NEXT_PUBLIC_AWS_REGION=...
NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID=...
NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID=...
AWS_API_BASE_URL=...
AWS_AUDIO_BUCKET_NAME=...
```

Keep secrets in AWS Secrets Manager or Amplify encrypted environment variables. Do not commit secrets.

## CDK commands

Preview synthesized CloudFormation:

```bash
npm --prefix infrastructure run synth
```

Review changes before deploy:

```bash
npm --prefix infrastructure run diff
```

Deploy only after explicit approval:

```bash
npm --prefix infrastructure run deploy
```

Destroy test infrastructure when finished:

```bash
npm --prefix infrastructure run destroy
```

## Database setup

Apply the AWS test schema to the AWS PostgreSQL database only:

```bash
psql "$AWS_DATABASE_URL" -f infrastructure/database/migrations/001_initial_schema.sql
```

Optional fake seed data:

```bash
psql "$AWS_DATABASE_URL" -f infrastructure/database/seeds/test_seed.sql
```

Rollback test schema:

```bash
psql "$AWS_DATABASE_URL" -f infrastructure/database/rollback/001_initial_schema_rollback.sql
```

Do not run these files against Supabase production.

## Amplify preparation

This branch includes `amplify.yml`. Connect a test branch in Amplify and set AWS test environment variables there. Keep the existing Vercel production project unchanged.

## Validation checklist

- App loads in the Amplify test URL.
- Auth uses Cognito test users only.
- Journal and healing flows still render.
- User-owned records cannot be read across users.
- S3 signed URL generation works for private objects.
- Local `/audio` fallback remains usable.
- No production Supabase records are modified.

