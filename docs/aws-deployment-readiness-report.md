# AWS deployment readiness report

Date: 2026-08-03  
Branch: `feature/aws-real-services`

## Classification

| Area | Status | Notes |
| --- | --- | --- |
| Frontend | partially ready | Standalone Next.js frontend builds. Real Cognito SDK and full API-backed journal/history replacement remain pending. |
| Backend API | partially ready | Health, journal CRUD, job creation, audio metadata, notifications endpoints scaffolded. PostgreSQL, SQS, Cognito JWKS and S3 adapters added. |
| Cognito | partially ready | Backend JWKS verifier added. Frontend Cognito signup/signin/reset/refresh still pending. API Gateway authorizer not attached. |
| PostgreSQL | partially ready | Parameterized repository and migrations added. Requires local/RDS integration testing. |
| RDS Proxy | partially ready | CDK provisions private RDS Proxy; backend config supports endpoint. No deployment run. |
| S3 | partially ready | Private storage adapter with signed URLs and validation added. Requires real bucket test. |
| AI worker | partially ready | Provider/worker skeleton added. Needs Lambda SQS event wiring and persistence of analysis result rows. |
| Audio worker | partially ready | Provider/worker skeleton added. Real audio provider not configured. |
| Notifications | partially ready | Safe provider abstraction added. Real WhatsApp disabled without approved test recipient. |
| Infrastructure | partially ready | CDK synth passes, private RDS/S3 and no wildcard CORS retained. Lambda still uses inline scaffold code. |
| Security | partially ready | Ownership and AWS-mode no-mock tests pass. Real Cognito/S3/RDS integration tests pending. |
| Tests | partially ready | 11 backend tests pass. No live AWS tests run. |
| Costs | requires manual AWS action | Add AWS Budget before deploy. Destroy stack after test. |

## Manual AWS actions required

1. Confirm isolated AWS test account/region.
2. Configure AWS Budget alerts.
3. Review CDK diff.
4. Deploy only after approval.
5. Apply migrations to the test RDS database.
6. Configure OpenAI secret in Secrets Manager or Lambda environment.
7. Configure WhatsApp only with an approved test recipient.
8. Run live Cognito, RDS and S3 integration tests.

## Do not deploy as production

This branch is not production-ready. It contains real service adapters, but the full AWS flow is not completely verified.
