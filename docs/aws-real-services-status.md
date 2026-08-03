# AWS real services status matrix

Date: 2026-08-03  
Branch: `feature/aws-real-services`

| Feature | Current implementation | Placeholder or real | AWS service required | Files involved | Work completed | Work remaining | Test status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Authentication | Cognito JWT verifier with JWKS; test verifier explicit | Partially real | Cognito | `backend/src/auth/cognito.ts`, `backend/src/runtime/factory.ts` | JWKS issuer/client/token checks added; AWS mode forbids test auth | Frontend Cognito SDK signup/signin/refresh still pending | Backend token failure tests pass |
| Users | Repository `ensureUser` maps Cognito subject to profile | Partially real | RDS PostgreSQL | `backend/src/repositories/postgres.ts` | Upsert profile by Cognito subject | Integration test with real PostgreSQL still pending | Type/build only |
| Journals | PostgreSQL repository plus memory tests | Partially real | RDS PostgreSQL | `backend/src/repositories/postgres.ts`, `backend/src/services/journal-service.ts` | Parameterized CRUD, ownership checks, transaction delete | Real DB integration test pending | Memory security tests pass |
| AI analysis | Provider interface + OpenAI provider + worker | Partially real | OpenAI, SQS, Lambda, RDS | `backend/src/services/ai-provider.ts`, `backend/src/workers/analysis-worker.ts` | Backend-only provider and failure-safe worker added | Store full analysis rows; SQS Lambda event handler not wired to worker | Worker failure test passes |
| Reset audio | Provider interface + worker + S3 upload path | Partially real | SQS, Lambda, S3, RDS | `backend/src/services/audio-provider.ts`, `backend/src/workers/audio-worker.ts`, `backend/src/storage/s3-storage.ts` | Private object key and upload validation added | Real audio provider not configured; worker Lambda event handler pending | Build only |
| File storage | S3 private storage adapter | Partially real | S3 | `backend/src/storage/s3-storage.ts` | Signed upload/download, MIME/size/extension validation, private paths | Live S3 integration test pending | Validation tests pass |
| Jobs | Repository jobs table + SQS queue adapter | Partially real | SQS, RDS | `backend/src/jobs/job-service.ts`, `backend/src/jobs/sqs-queue.ts`, `002_real_services.sql` | Idempotent job creation, queued/processing/completed/failed statuses, SQS enqueue adapter | Lambda worker event dispatch pending | Duplicate job tests pass |
| Notifications | Provider abstraction and disabled/safe mock provider | Partially real | EventBridge, SQS, WhatsApp provider | `backend/src/services/whatsapp-provider.ts`, `backend/src/services/notification-service.ts` | Safe disabled behavior documented | Real WhatsApp provider not enabled; approved test recipient required | Not yet covered beyond docs |
| Preferences | Existing profile columns in schema | Partially real | RDS PostgreSQL | `001_initial_schema.sql`, `backend/src/repositories/postgres.ts` | Schema supports preferences | API endpoints for update preferences pending | Not tested |
| Database | PostgreSQL repository + additive migration | Partially real | RDS PostgreSQL/RDS Proxy | `backend/src/repositories/postgres.ts`, `infrastructure/database/migrations/002_real_services.sql` | Parameterized queries and indexes added | Real RDS/local PostgreSQL integration run pending | Build only |
| API security | Safe errors, request IDs, CORS in local server/CDK | Partially real | API Gateway | `backend/src/shared/http.ts`, `backend/src/local-server.ts`, `infrastructure/lib/*` | No wildcard CORS; versioned proxy route | API Gateway Cognito authorizer not yet attached | Backend tests pass |
| Monitoring | CloudWatch alarms for API errors/DLQ | Partially real | CloudWatch | `infrastructure/lib/inner-pause-aws-test-stack.ts` | Logs retention and alarms exist | Add Lambda-specific alarms if deployed | CDK synth passes |

## AWS mode blockers

- Real frontend Cognito SDK flow is not complete.
- Worker Lambda event handlers do not yet dispatch SQS records to `AnalysisWorker`/`AudioWorker`.
- PostgreSQL repository has not been integration-tested against a live database.
- S3 signed URL generation has not been tested against a real private bucket.
- OpenAI worker result persistence needs full `emotional_analyses` insert logic.
- WhatsApp is intentionally disabled until an approved test recipient and provider are configured.
