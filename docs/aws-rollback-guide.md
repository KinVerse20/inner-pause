# AWS full wiring rollback guide

No production Vercel/Supabase resource was modified by the AWS wiring branch.

## Return to the previous separated scaffold

```bash
git switch feature/aws-separated-frontend-backend
```

or inspect the safety tag:

```bash
git show pre-full-aws-wiring
```

## Return to the earlier AWS scaffold

```bash
git switch feature/aws-full-stack-test
```

or inspect:

```bash
git show pre-frontend-backend-separation
```

## Return to production branch

```bash
git switch main
```

Do not merge `feature/aws-full-wiring` into `main` until real Cognito, PostgreSQL, S3, AI/audio jobs and notification tests pass.

## Stop AWS charges after a test deploy

Only run this after confirming the account and stack are the intended test resources:

```bash
npm --prefix infrastructure run destroy
```

Then verify manually in AWS:

- RDS instance is gone.
- RDS Proxy is gone.
- NAT Gateway is gone.
- API Gateway is gone.
- Lambda functions are gone.
- SQS queues are gone.
- EventBridge rules are gone.
- CloudWatch logs are retained only as intended.
- S3 buckets retained by policy are intentionally emptied or preserved.

