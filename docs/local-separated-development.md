# Local separated development

This setup runs the AWS-test frontend and backend separately without touching Vercel or Supabase production.

## 1. Backend

```bash
cd "/Users/sahil/Documents/Healing App/backend"
npm install
npm run dev
```

Local backend URL:

```text
http://localhost:4000/api/v1
```

For quick UI testing, use explicit local test mode:

```text
BACKEND_RUNTIME_MODE=local
AUTH_MODE=test
REPOSITORY_MODE=memory
STORAGE_MODE=local
AI_MODE=disabled
NOTIFICATIONS_MODE=disabled
```

For local PostgreSQL testing, create a local test database and set:

```text
REPOSITORY_MODE=postgres
DATABASE_URL=postgres://USER:PASSWORD@localhost:5432/innerpause_test
DATABASE_SSL=false
```

Then apply:

```bash
psql "$DATABASE_URL" -f ../infrastructure/database/migrations/001_initial_schema.sql
psql "$DATABASE_URL" -f ../infrastructure/database/migrations/002_real_services.sql
```

Do not point `DATABASE_URL` at production Supabase.

## 2. Frontend

```bash
cd "/Users/sahil/Documents/Healing App/frontend"
npm install
npm run dev
```

Frontend env:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 3. Validation

```bash
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix frontend run test

npm --prefix backend run lint
npm --prefix backend run build
npm --prefix backend run test

npm --prefix packages/shared run build
npm --prefix infrastructure run build
npm --prefix infrastructure run synth

node scripts/aws-secret-scan.mjs
```

## 4. Test authentication

Local test mode accepts only explicit test tokens in backend tests and local UI compatibility. AWS mode must use Cognito and will fail if `AUTH_MODE=test`.

## 5. AWS mode safety

AWS mode must not use:

- memory repository
- test auth
- local file storage
- fake AI responses
- fake WhatsApp sends

The backend validates this on startup.

