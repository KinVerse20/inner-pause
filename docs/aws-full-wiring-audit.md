# AWS full wiring audit

Date: 2026-08-03  
Branch: `feature/aws-full-wiring`  
Safety tag: `pre-full-aws-wiring`

## Summary

The completed root Next.js app was copied into `frontend/` as a standalone Next.js application. The root app remains intact as a production/Vercel/Supabase reference.

The new frontend has no copied Next.js API routes and no direct references to Supabase, OpenAI, WhatsApp, Twilio, Stripe, or raw `/api/analyze` calls in:

- `frontend/app`
- `frontend/components`
- `frontend/lib`

The backend remains a Lambda/API Gateway TypeScript scaffold with in-memory repositories and test-token authentication. Real PostgreSQL, Cognito JWKS verification, S3 signed URL generation, OpenAI/SQS workers and WhatsApp provider execution are not complete yet.

## Feature-by-feature audit

| Feature | Current root location | New frontend location | New backend location | API endpoint | AWS service | Migration status |
| --- | --- | --- | --- | --- | --- | --- |
| App layout | `app/layout.tsx` | `frontend/app/layout.tsx` | none | none | Amplify Hosting | Copied and builds |
| Home | `app/page.tsx`, `components/home-screen.tsx` | `frontend/app/page.tsx`, `frontend/components/home-screen.tsx` | none | none | Amplify Hosting | Copied |
| Onboarding | `app/onboarding/page.tsx`, `components/onboarding-screen.tsx` | copied | none | none | Amplify Hosting | Copied |
| Auth UI | `app/auth/page.tsx`, `components/auth-screen.tsx` | copied and Supabase removed | `backend/src/auth/cognito.ts` | `POST /api/v1/auth/session` | Cognito | Frontend boundary added; real Cognito SDK/JWKS still pending |
| Password reset | `components/reset-password-screen.tsx` | copied and Supabase removed | pending | pending Cognito endpoint/hosted flow | Cognito | Placeholder messaging only |
| Session sync | `components/auth-session-sync.tsx` | copied and Supabase removed | `GET /api/v1/me` | `GET /api/v1/me` | Cognito + API Gateway | Uses frontend token storage; real token refresh pending |
| Journal form | `components/expression-panel.tsx` | copied and raw fetch removed | `backend/src/routes/router.ts` | `POST /api/v1/analysis/quick` | API Gateway + Lambda | Calls backend API client; still synchronous fallback, not SQS |
| Journal local persistence | `lib/mvp-storage.ts` | copied | pending repositories | journal endpoints | RDS PostgreSQL | UI still uses localStorage for current flow |
| Emotional insight | `app/analysis/page.tsx`, `components/analysis-screen.tsx` | copied | quick analysis helper | `POST /api/v1/analysis/quick` | Lambda | Backend fallback only; OpenAI job flow pending |
| Healing plan | `components/healing-plan-screen.tsx`, `lib/healing-engine.ts` | copied | pending plan service | pending | Lambda/RDS | UI copied; generation still frontend/local logic |
| Audio player | player components, `public/audio/*` | copied | `backend/src/services/audio-service.ts` | `GET /api/v1/audio/:id` | S3 | UI copied; S3 signed URL implementation pending |
| Chakra journeys | `app/session/**`, journey components | copied | none currently | none currently | Amplify Hosting | Copied; still localStorage based |
| Profile | `components/profile-screen.tsx` | copied and Supabase removed | pending preferences/profile repo | `GET /api/v1/me`, future preferences endpoint | Cognito/RDS | Device-local profile save remains |
| Notifications | `lib/mvp-storage.ts` mock guidance | copied | `backend/src/services/notification-service.ts` | `GET /api/v1/notifications`, `POST /api/v1/notifications/test` | EventBridge/SQS/WhatsApp | API scaffold only; no real sends |
| Root API analysis | `app/api/analyze/route.ts` | not copied into active frontend routes | backend quick helper | `/api/v1/analysis/quick`, future `/journals/:id/analyse` | Lambda/SQS/OpenAI | Frontend API route removed |
| Root profile APIs | `app/api/profile/**` | not copied into active frontend routes | backend router scaffold | `/api/v1/me` | API Gateway/RDS | Frontend API routes removed |
| Supabase server/admin | `lib/supabase/**` | not copied | none for AWS | none | Supabase production only | Not used by AWS frontend |
| PWA assets | `public/sw.js`, `app/manifest.ts` | copied | none | none | Amplify Hosting | Copied |
| AWS infrastructure | `infrastructure/**` | none | `infrastructure/**` | outputs API/Cognito/S3 values | CDK | Synth passes; no deploy run |

## Environment variable audit

Root production/reference variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- WhatsApp/Twilio/Stripe optional variables

New frontend public variables:

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_AWS_REGION`
- `NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID`
- `NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID`
- `NEXT_PUBLIC_APP_URL`

New backend private variables:

- `AWS_REGION`
- `AWS_COGNITO_USER_POOL_ID`
- `AWS_COGNITO_USER_POOL_CLIENT_ID`
- `AWS_AUDIO_BUCKET_NAME`
- `AWS_DATABASE_SECRET_ARN`
- `AWS_DATABASE_PROXY_ENDPOINT`
- `AWS_WORK_QUEUE_URL`
- `OPENAI_API_KEY`
- WhatsApp provider test variables

## Current blockers to full AWS completion

- Real Cognito signup/signin/refresh is not wired into the frontend.
- Backend JWT verifier still supports test tokens, not Cognito JWKS validation.
- Backend repository is still in-memory for tests.
- PostgreSQL/RDS repository implementation is not complete.
- S3 signed URL generation is not complete.
- AI and audio jobs are not processed through SQS workers yet.
- Notification provider execution remains a safe stub.

