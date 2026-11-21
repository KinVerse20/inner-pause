# AWS CDK diff readiness

Use this before any AWS test deployment.

## Directory

```bash
cd "/Users/sahil/Documents/Healing App/infrastructure"
```

## Install

```bash
npm install
```

## Confirm the AWS account

```bash
aws sts get-caller-identity
```

Stop if the account or region is not the isolated AWS test account.

## Bootstrap

```bash
npx cdk bootstrap
```

## Diff

```bash
npm run diff
```

## What to look for

Confirm the diff shows:

- API Lambda packaged from a CDK asset, not inline code
- analysis worker Lambda packaged from a CDK asset
- audio worker Lambda packaged from a CDK asset
- notification worker Lambda packaged from a CDK asset
- schedule Lambda packaged from a CDK asset
- RDS is not public
- S3 has Block Public Access
- API CORS origins are explicit
- Lambda environment variables contain names/ARNs only, not secret values
- OpenAI key is referenced through Secrets Manager

## Resources that cost money

Hourly or ongoing charges may come from:

- NAT Gateway
- RDS PostgreSQL instance
- RDS Proxy
- VPC endpoints if added later
- CloudWatch logs retained over time
- Amplify builds/hosting

Usage-based charges may come from:

- Lambda invocations
- API Gateway requests
- SQS requests
- S3 storage and requests
- Secrets Manager

## Red flags that should stop deployment

- Any Lambda `ZipFile` inline code appears in the template.
- RDS says `PubliclyAccessible: true`.
- S3 public access is not blocked.
- CORS uses wildcard origins with credentials.
- Secret values appear directly in CloudFormation.
- The account from `aws sts get-caller-identity` is production.
- The region is not the agreed AWS test region.

## Rollback

For code rollback:

```bash
git checkout feature/aws-deployment-ready
git reset --hard pre-lambda-packaging
```

For AWS rollback after a test deployment:

```bash
cd "/Users/sahil/Documents/Healing App/infrastructure"
npm run destroy
```

The S3 audio bucket is retained by design. Empty/delete it manually only after confirming no test files are needed.

