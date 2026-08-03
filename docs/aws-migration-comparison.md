# Supabase to AWS migration comparison

This branch does not perform a production migration. It creates a separate AWS-compatible schema and test infrastructure for evaluation.

## Table mapping

| Supabase table | AWS PostgreSQL table | Notes |
| --- | --- | --- |
| `profiles` | `profiles` | `auth.users` FK is replaced by a provider-owned `user_id` UUID. Cognito subject can be stored separately as `auth_provider_subject`. |
| `journal_entries` | `journal_entries` | Same user ownership model through `user_id`. |
| `emotional_analyses` | `emotional_analyses` | JSONB columns preserved. |
| `healing_sessions` | `healing_sessions` | Manifest and playback JSON preserved. |
| `session_feedback` | `session_feedback` | Same feedback metrics. |
| `user_patterns` | `user_patterns` | Same recurring-pattern model. |
| `morning_guidance` | `morning_guidance` | Delivery status and channel preserved. |
| `audio_tracks` | `audio_tracks` | Static `/audio` paths can coexist with future S3 object keys. |
| `subscriptions` | `subscriptions` | Kept for schema compatibility, provider can remain mock in AWS test. |

## Auth differences

Supabase stores auth users in `auth.users`. AWS Cognito stores users outside PostgreSQL.

AWS test schema therefore uses:

- `profiles.id` as the app user UUID.
- `profiles.auth_provider = 'cognito'`.
- `profiles.auth_provider_subject` for Cognito `sub`.
- `profiles.email` for lookup and support workflows.

## Row ownership

Supabase RLS is replaced in AWS by application-layer ownership checks in backend services. Every query must include authenticated user context and filter by `user_id`.

Future production AWS migration should add:

- A query helper that requires `userId`.
- Integration tests proving cross-user access is denied.
- Optional PostgreSQL RLS with session variables if direct DB access expands.

## Migration safety

For this branch:

- The Supabase production schema is not modified.
- The AWS migration is separate under `infrastructure/database/migrations`.
- Seed data is fake only.
- Rollback SQL drops AWS test tables in dependency order.

## Data migration options for later

1. Fresh-start AWS accounts and no historical migration.
2. Export/import user-owned journal and session data after explicit consent.
3. Dual-write test period, then compare record counts and sample records.
4. Read-only Supabase archive with AWS as the new write system.

No option is implemented in this branch.

