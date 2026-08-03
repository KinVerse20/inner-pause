# Frontend/backend separation audit

Date: 2026-08-03  
Source branch: `feature/aws-full-stack-test`  
Separation branch: `feature/aws-separated-frontend-backend`

## Scope

This audit classifies the current files and defines where they belong in the AWS test separation. The existing root Next.js app is preserved so the current completed UI remains buildable while the separated AWS frontend/backend are introduced.

## Current classification

| Area | Current files | Classification | AWS separation target |
| --- | --- | --- | --- |
| App routes/pages | `app/**/*.tsx`, `app/**/*.ts` except API and auth callback | Frontend UI, layouts, route shells | `frontend/` Next.js app in a later physical move |
| UI components | `components/**/*.tsx` | Frontend UI | `frontend/components` |
| Global styling | `app/globals.css` | Frontend styling | `frontend/app/globals.css` |
| Chakra content | `data/chakras.ts` | Shared content + audio metadata | Shared/frontend content; backend may read safe metadata only |
| Local state | `lib/mvp-storage.ts`, `lib/use-mvp-state.ts`, `lib/use-app-preferences.ts`, `lib/use-progress-store.ts` | Frontend client state/localStorage | `frontend/lib/state` |
| Audio player | `components/player-provider.tsx`, `components/*player*.tsx`, `public/audio/*` | Frontend audio playback | `frontend/components`, static fallback assets or signed backend URLs |
| Supabase browser auth | `lib/supabase/browser.ts`, auth components | Authentication logic | Keep in production root; AWS frontend uses Cognito client integration |
| Supabase server/admin | `lib/supabase/server.ts`, `lib/supabase/admin.ts`, `lib/supabase/profile.ts` | Backend/database/auth logic | `backend/src/repositories`, `backend/src/auth` for AWS |
| API analysis route | `app/api/analyze/route.ts` | Backend API + AI logic | `backend/src/routes`, `backend/src/services` |
| Profile API routes | `app/api/profile/route.ts`, `app/api/profile/signup/route.ts` | Backend API + auth/profile database logic | `backend/src/routes`, `backend/src/repositories` |
| Auth callback | `app/auth/confirm/route.ts`, `proxy.ts` | Auth routing/session protection | Root production remains Supabase; AWS frontend/backend uses Cognito token flow |
| Analysis schemas | `lib/ai-schemas.ts` | Shared validation + backend AI schema | Shared schema if safe; backend owns provider prompts/secrets |
| Healing engine | `lib/healing-engine.ts` | AI fallback + plan generation logic | Backend service for API generation; safe display types in shared package |
| Provider boundary | `lib/providers/**/*` | Shared provider abstraction | Root bridge while AWS separation is tested |
| Supabase migration | `supabase/migrations/*.sql` | Production Supabase DB schema | Do not move or edit for AWS separation |
| AWS infrastructure | `infrastructure/**/*` | Infrastructure | Remains `infrastructure/` |
| Docs | `docs/**/*` | Documentation | Remains `docs/` |
| PWA assets | `public/sw.js`, `app/manifest.ts`, icons | Frontend/PWA | `frontend/public`, `frontend/app/manifest.ts` in later physical move |
| Config | `package.json`, `tsconfig.json`, `eslint.config.mjs`, env examples | Configuration | Root orchestration plus per-project config |

## Current Next.js API routes and movement plan

### `POST /api/analyze`

Current file:

- `app/api/analyze/route.ts`

Current responsibilities:

- Validate journal text.
- Use OpenAI when configured.
- Return deterministic fallback insight when OpenAI is unavailable.

AWS target:

- `POST /api/v1/journals/:id/analyse`
- Backend creates a job and returns a job id.
- Worker performs analysis and saves the result.
- Frontend polls `GET /api/v1/jobs/:id`.

### `POST /api/profile`

Current file:

- `app/api/profile/route.ts`

Current responsibilities:

- Read Supabase session.
- Create/update authenticated user profile.

AWS target:

- `GET /api/v1/me`
- Future `PATCH /api/v1/me/preferences`
- Backend verifies Cognito token and upserts/reads profile by authenticated subject.

### `POST /api/profile/signup`

Current file:

- `app/api/profile/signup/route.ts`

Current responsibilities:

- Verify Supabase signup user through service role.
- Create/update profile row.

AWS target:

- Cognito signup happens in frontend.
- Backend `POST /api/v1/auth/session` can ensure profile exists after token verification.
- No service-role key is exposed to frontend.

### `/auth/confirm`

Current file:

- `app/auth/confirm/route.ts`

Current responsibilities:

- Complete Supabase email confirmation code exchange.

AWS target:

- Cognito hosted confirmation or frontend Cognito confirmation flow.
- Backend does not accept a user id from frontend; it verifies Cognito tokens.

## New AWS separated directories

- `frontend/`: API client, future Next.js UI move target, Cognito frontend boundary.
- `backend/`: API Gateway/Lambda-compatible TypeScript backend.
- `packages/shared/`: API request/response types and safe enums.
- `infrastructure/`: AWS CDK test stack.

## Production protection

The root app, Supabase migration, Vercel configuration and production auth redirect were not moved or rewritten. This preserves current production behavior while the AWS separated architecture is evaluated.

