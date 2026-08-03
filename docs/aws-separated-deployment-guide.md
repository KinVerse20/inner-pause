# AWS separated deployment guide

This guide describes the separated AWS test architecture. It does not modify the current Vercel/Supabase production app.

## 1. Frontend deployment

The AWS test frontend lives in `frontend/`. It should be deployed to AWS Amplify Hosting on branch:

```text
feature/aws-separated-frontend-backend
```

The frontend must call the backend only through:

```text
NEXT_PUBLIC_API_BASE_URL
```

## 2. Backend deployment

The backend lives in `backend/`. It is structured for API Gateway and Lambda.

The CDK stack in `infrastructure/` provisions:

- API Gateway
- Lambda
- Cognito
- RDS PostgreSQL
- RDS Proxy
- Private S3 bucket
- SQS and dead-letter queue
- EventBridge schedule
- CloudWatch alarms/logs
- Secrets Manager database credential

## 3. Connecting the API URL

After CDK deploy, use the `ApiBaseUrl` output as the frontend value:

```text
NEXT_PUBLIC_API_BASE_URL=<ApiBaseUrl>/api/v1
```

Do not place backend-only secrets in Amplify frontend variables.

## 4. Amplify environment variables

Frontend/Amplify variables:

```text
NEXT_PUBLIC_API_BASE_URL
NEXT_PUBLIC_AWS_REGION
NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID
NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID
NEXT_PUBLIC_APP_URL
```

These are public by design.

## 5. AWS Secrets Manager values

Backend-only secrets:

```text
Database credentials
OPENAI_API_KEY
WhatsApp provider tokens
Stripe secret keys, if used later
```

Do not expose these to frontend builds.

## 6. Local testing

Frontend:

```bash
cd frontend
npm install
npm run build
npm run test
```

Backend:

```bash
cd backend
npm install
npm run dev
```

Use:

```text
http://localhost:4000/api/v1
```

as the local backend URL.

## 7. AWS testing

Before deployment:

```bash
npm --prefix infrastructure install
npm --prefix infrastructure run build
npm --prefix infrastructure run synth
```

Preview:

```bash
npm --prefix infrastructure run diff
```

Deploy only after explicit approval:

```bash
npm --prefix infrastructure run deploy
```

## 8. Viewing backend logs

Use CloudWatch Logs for:

- API Lambda log group
- Worker Lambda log group
- API Gateway execution logs
- SQS dead-letter queue alarms

Every request should include or receive an `x-request-id`.

## 9. Stopping AWS resources and avoiding charges

For temporary tests:

```bash
npm --prefix infrastructure run destroy
```

Also verify manually:

- RDS instance removed
- NAT Gateway removed
- S3 bucket retained or emptied intentionally
- CloudWatch logs retention is limited
- AWS Budget alerts are active

## 10. Returning to the previous branch

The branch before separation is protected by:

```text
pre-frontend-backend-separation
```

To return:

```bash
git switch feature/aws-full-stack-test
```

To inspect the protected snapshot:

```bash
git show pre-frontend-backend-separation
```

