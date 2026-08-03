# AWS full test checklist

Use fake test users and fake journal data only.

## Local frontend

- [x] `npm --prefix frontend run lint`
- [x] `npm --prefix frontend run build`
- [x] `npm --prefix frontend run test`
- [ ] Manual browser test against local backend
- [ ] Verify no horizontal mobile overflow after final API wiring

## Local backend

- [x] `npm --prefix backend run build`
- [x] `npm --prefix backend run test`
- [ ] Real local PostgreSQL connection test
- [ ] Real Cognito JWKS verification test
- [ ] Real S3 signed URL test with private test bucket
- [ ] SQS worker integration test

## Security checks

- [x] User A cannot access User B journals in backend tests
- [x] User A cannot access User B audio in backend tests
- [x] Unauthenticated protected requests fail in backend tests
- [x] Frontend source has no Supabase/OpenAI/WhatsApp private-service references
- [x] Secret scan passes
- [ ] Frontend production bundle secret scan
- [ ] RDS private subnet verification after deploy
- [ ] S3 Block Public Access verification after deploy
- [ ] Cognito issuer/audience/expiry verification with real tokens

## Full flows still requiring real AWS wiring

- [ ] Signup → verify email → sign in → protected app → sign out
- [ ] Journal → PostgreSQL save → list → detail
- [ ] Journal analysis → SQS job → AI provider → stored result → frontend display
- [ ] Reset audio → SQS job → audio provider → private S3 → signed playback URL
- [ ] Scheduled test notification → provider-safe processing → history record

