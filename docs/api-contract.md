# The InnerPause API contract

All AWS backend endpoints are versioned under:

```text
/api/v1
```

Frontend calls must use:

```text
NEXT_PUBLIC_API_BASE_URL
```

Authentication uses a Cognito access token:

```text
Authorization: Bearer <access_token>
```

All JSON responses include a `requestId`. Error responses never return stack traces or secrets.

## `GET /api/v1/health`

Purpose: Public backend health check.  
Authentication: Not required.  
Request body: none.  
Response: `{ ok: boolean, service: string }`  
Validation: none.  
Ownership checks: none.  
Errors: `INTERNAL_ERROR`  
Mode: synchronous.

## `POST /api/v1/auth/session`

Purpose: Validate the current Cognito token and return the current user.  
Authentication: required.  
Request body: none.  
Response: `{ id, email, fullName }`  
Validation: token must be valid and unexpired.  
Ownership checks: backend derives user identity from token only.  
Errors: `UNAUTHENTICATED`, `CONFIGURATION_ERROR`  
Mode: synchronous.

## `POST /api/v1/analysis/quick`

Purpose: Temporary AWS-test compatibility endpoint for the migrated frontend journal flow. It returns a deterministic emotional insight from the backend so the frontend does not call the old Next.js `/api/analyze` route or OpenAI directly.  
Authentication: Not currently required in local test mode. Must be protected before AWS test launch.  
Request body:

```json
{
  "text": "string"
}
```

Response: `{ analysis }`  
Validation: `text` is required.  
Ownership checks: none in the temporary local compatibility path.  
Errors: `NOT_FOUND`, `INTERNAL_ERROR`  
Mode: synchronous temporary backend fallback. Replace with `/journals/:id/analyse` plus SQS before real AWS testing.

## `GET /api/v1/me`

Purpose: Return current authenticated profile identity.  
Authentication: required.  
Request body: none.  
Response: `{ id, email, fullName }`  
Validation: token must be valid and unexpired.  
Ownership checks: identity comes from Cognito token.  
Errors: `UNAUTHENTICATED`  
Mode: synchronous.

## `POST /api/v1/journals`

Purpose: Create a private journal reflection.  
Authentication: required.  
Request body:

```json
{
  "rawText": "string",
  "title": "optional string",
  "transcription": "optional string",
  "emotionalIntensityBefore": 1,
  "idempotencyKey": "optional string"
}
```

Response: `{ journal }`  
Validation: `rawText` 3-10000 chars; intensity 1-10 if supplied.  
Ownership checks: `user_id` is taken from the token, never from request body.  
Errors: `UNAUTHENTICATED`, `VALIDATION_ERROR`, `DUPLICATE_REQUEST`  
Mode: synchronous database write.

## `GET /api/v1/journals`

Purpose: List current user's journal summaries.  
Authentication: required.  
Request body: none.  
Response: `JournalSummary[]`  
Validation: none.  
Ownership checks: query filters by authenticated user id.  
Errors: `UNAUTHENTICATED`  
Mode: synchronous.

## `GET /api/v1/journals/:id`

Purpose: Get one private journal.  
Authentication: required.  
Request body: none.  
Response: `JournalDetail`  
Validation: `id` must identify an existing journal.  
Ownership checks: journal must belong to authenticated user.  
Errors: `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`  
Mode: synchronous.

## `DELETE /api/v1/journals/:id`

Purpose: Delete one private journal and dependent records where allowed.  
Authentication: required.  
Request body: none.  
Response: `{ deleted: true }`  
Validation: `id` must identify an existing journal.  
Ownership checks: journal must belong to authenticated user.  
Errors: `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`  
Mode: synchronous transaction.

## `POST /api/v1/journals/:id/analyse`

Purpose: Queue emotional insight generation for a journal.  
Authentication: required.  
Request body: none.  
Headers: optional `Idempotency-Key`.  
Response: `{ jobId, status }`  
Validation: journal must exist.  
Ownership checks: journal must belong to authenticated user before job creation.  
Errors: `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `DUPLICATE_REQUEST`  
Mode: asynchronous through SQS.

## `POST /api/v1/journals/:id/reset-audio`

Purpose: Queue reset-audio generation for a journal.  
Authentication: required.  
Request body: optional audio/session preferences in future.  
Headers: optional `Idempotency-Key`.  
Response: `{ jobId, status }`  
Validation: journal must exist.  
Ownership checks: journal must belong to authenticated user before job creation.  
Errors: `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `DUPLICATE_REQUEST`  
Mode: asynchronous through SQS.

## `GET /api/v1/jobs/:id`

Purpose: Check analysis/audio job status.  
Authentication: required.  
Request body: none.  
Response: `{ jobId, type, status, resultId?, errorMessage? }`  
Validation: job must exist.  
Ownership checks: job must belong to authenticated user.  
Errors: `UNAUTHENTICATED`, `NOT_FOUND`  
Mode: synchronous.

## `GET /api/v1/audio/:id`

Purpose: Return metadata and a short-lived signed playback URL.  
Authentication: required.  
Request body: none.  
Response: `{ id, journalId?, title, durationSeconds, playbackUrl, expiresAt }`  
Validation: audio id must exist.  
Ownership checks: audio record must belong to authenticated user.  
Errors: `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`  
Mode: synchronous; signed URL generation is backend-only.

## `DELETE /api/v1/audio/:id`

Purpose: Delete private audio metadata and object.  
Authentication: required.  
Request body: none.  
Response: `{ deleted: true }`  
Validation: audio id must exist.  
Ownership checks: audio record must belong to authenticated user.  
Errors: `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`  
Mode: synchronous transaction plus S3 delete.

## `GET /api/v1/insights`

Purpose: Return current user's aggregate wellbeing insight summary.  
Authentication: required.  
Request body: none.  
Response: `{ journalCount, recurringEmotions, latestReflectionAt? }`  
Validation: none.  
Ownership checks: aggregate only current user's data.  
Errors: `UNAUTHENTICATED`  
Mode: synchronous.

## `GET /api/v1/notifications`

Purpose: List current user's notification records.  
Authentication: required.  
Request body: none.  
Response: `NotificationMessage[]`  
Validation: none.  
Ownership checks: query filters by authenticated user id.  
Errors: `UNAUTHENTICATED`  
Mode: synchronous.

## `POST /api/v1/notifications/test`

Purpose: Queue a test notification through mock/WhatsApp provider.  
Authentication: required.  
Request body: none.  
Response: `{ queued: boolean }`  
Validation: notification provider must be configured or mock mode enabled.  
Ownership checks: message is created for authenticated user only.  
Errors: `UNAUTHENTICATED`, `CONFIGURATION_ERROR`  
Mode: asynchronous provider job.
