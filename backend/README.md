# The InnerPause backend

This directory is the AWS test backend boundary.

It is structured for API Gateway and Lambda while staying runnable locally. Only backend code may access PostgreSQL, S3 privileged operations, OpenAI, WhatsApp providers, Secrets Manager, and background queues.

Local commands:

```bash
cd backend
npm install
npm run build
npm run test
npm run dev
```

Local API base URL:

```text
http://localhost:4000/api/v1
```

