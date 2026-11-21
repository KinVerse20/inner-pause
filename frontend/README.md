# The InnerPause frontend

This directory is the AWS test frontend boundary.

The current production UI still lives at the repository root while the AWS separation is tested. New AWS-facing frontend code must communicate with the backend through `NEXT_PUBLIC_API_BASE_URL` and must not import database, OpenAI, WhatsApp, S3 privileged, Secrets Manager, or service-role code.

Local commands:

```bash
cd frontend
npm install
npm run build
npm run test
```

When the existing Next.js UI is moved into this directory later, keep all backend calls routed through `frontend/lib/api/client.ts`.

