# AWS post-deployment setup report

Date: 2026-08-04  
Project: The Inner Pause / InnerPause AWS separated test environment  
Branch reviewed: `feature/aws-account-setup`  
AWS profile used: `inner-pause`

## Scope and safety checks

- Target AWS account confirmed: `777832746097`
- Target AWS region confirmed: `ap-south-1`
- Target environment: `test`
- Production Vercel: not touched
- Production Supabase: not touched
- Git `main`: not touched
- WhatsApp messages: not sent
- RDS public access: not enabled
- S3 public access: not enabled
- AWS stack: not destroyed
- OpenAI secret value: not printed or read

AWS identity confirmed:

```text
Account: 777832746097
ARN: arn:aws:iam::777832746097:user/inner-pause-deployer
Region: ap-south-1
```

## Health endpoint status

Endpoint tested:

```text
https://hdbv2aqjv1.execute-api.ap-south-1.amazonaws.com/test/health
```

Result:

```text
HTTP/2 200
{"data":{"ok":true,"service":"innerpause-backend"},"requestId":"9c142dab-edfa-499d-a5dd-3b346ad0104a"}
```

Status: passed.

## Database migration approach

The RDS database is private and must remain private. Direct migration from the Mac is not the correct path because the database is only reachable inside the VPC.

The safe migration path used was:

1. Create a temporary one-time Lambda function in the deployed VPC.
2. Attach it to the existing private egress subnets and existing Lambda security group.
3. Connect to the RDS Proxy using IAM database authentication.
4. Apply only the local SQL migrations from `infrastructure/database/migrations`.
5. Verify expected tables.
6. Delete the temporary Lambda and IAM role after completion.

Temporary migration resources were removed after successful verification.

## Migration status

Migrations applied:

- `001_initial_schema.sql`
- `002_real_services.sql`

Verification result:

```text
missing: []
migrations:
- 001_initial_schema.sql
- 002_real_services.sql
```

Status: passed.

## Database tables created

The following expected public tables exist:

- `audio_records`
- `audio_tracks`
- `emotional_analyses`
- `healing_sessions`
- `jobs`
- `journal_entries`
- `morning_guidance`
- `notification_messages`
- `profiles`
- `schema_migrations`
- `session_feedback`
- `subscriptions`
- `user_patterns`

## Amplify status

Amplify App ID:

```text
d2hbf3vde4pxs7
```

Amplify app name:

```text
innerpause-aws-separated-test
```

Amplify default domain:

```text
d2hbf3vde4pxs7.amplifyapp.com
```

Current Amplify repository status:

```text
repository: null
productionBranch: null
enableBranchAutoBuild: false
```

Current Amplify branch:

```text
branchName: feature/aws-account-setup
stage: DEVELOPMENT
enableAutoBuild: false
totalNumberOfJobs: 0
```

Status: the Amplify app exists, but the GitHub repository is not connected and auto-build is not enabled.

## Frontend environment variables

The frontend code uses these exact variable names:

```text
NEXT_PUBLIC_API_BASE_URL
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_AWS_REGION
NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID
NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID
```

Use these values for the AWS test frontend:

```text
NEXT_PUBLIC_API_BASE_URL=https://hdbv2aqjv1.execute-api.ap-south-1.amazonaws.com/test
NEXT_PUBLIC_APP_URL=https://<amplify-branch-url>
NEXT_PUBLIC_AWS_REGION=ap-south-1
NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID=ap-south-1_lUYwsiWWp
NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID=1pm2hoome73cgql0dtp6he374n
```

Note: the user-provided names `NEXT_PUBLIC_COGNITO_USER_POOL_ID` and `NEXT_PUBLIC_COGNITO_CLIENT_ID` are not the names currently read by the frontend. The code reads the AWS-prefixed names above.

## Cognito status

User Pool ID:

```text
ap-south-1_lUYwsiWWp
```

App Client ID:

```text
1pm2hoome73cgql0dtp6he374n
```

Enabled auth flows:

- `ALLOW_REFRESH_TOKEN_AUTH`
- `ALLOW_USER_PASSWORD_AUTH`
- `ALLOW_USER_SRP_AUTH`

Supported identity provider:

- `COGNITO`

Current callback URL:

```text
https://example.com
```

Issue: this placeholder callback URL must be replaced with the actual Amplify app URL before browser-based email verification/callback testing.

## OpenAI secret status

Secret exists:

```text
InnerPauseOpenAiSecret1B9FE-4hRCt19cUCNf
```

Description from Secrets Manager:

```text
OpenAI API key for The InnerPause AWS test analysis worker. Replace generated value before testing analysis.
```

The secret value was not read, printed or logged.

Status: secret resource exists, but the value still needs to be set manually before real analysis-worker testing.

## S3 privacy status

Audio bucket checked:

```text
innerpauseawsteststack-innerpausetestaudiobucketdd-ps5tfabtn5g9
```

Public access block:

```text
BlockPublicAcls: true
IgnorePublicAcls: true
BlockPublicPolicy: true
RestrictPublicBuckets: true
```

Bucket policy status:

```text
IsPublic: false
```

Status: passed.

## Protected route check

Unauthenticated request tested:

```text
GET https://hdbv2aqjv1.execute-api.ap-south-1.amazonaws.com/test/journals
```

Result:

```text
HTTP/2 403
{"message":"Missing Authentication Token"}
```

Status: unauthenticated access is blocked.

## Audio and WhatsApp status

Audio generation:

- Disabled by design because no final audio provider is configured.
- The backend uses `DisabledAudioProvider` for reset-audio worker processing.

WhatsApp:

- Sending was not tested.
- No WhatsApp messages were sent.
- Notifications remain disabled/mock-safe unless explicitly configured with an approved test recipient.

## Smoke tests

Passed:

- AWS identity/account/region check
- Public health endpoint
- Safe private migration execution through VPC Lambda and RDS Proxy
- Database table verification
- S3 public access block check
- S3 bucket policy public-status check
- Protected route rejects unauthenticated access
- Analysis queue is empty

Not run yet:

- Cognito signup
- Email verification
- Login
- Authenticated journal creation
- Authenticated journal listing
- Cross-user access protection
- AI analysis queue end-to-end processing

Reason these were not run:

- No owner-controlled disposable test email was provided.
- Amplify is not connected to GitHub yet.
- Cognito callback URL is still `https://example.com`.
- The OpenAI secret description indicates the generated value must be replaced before real analysis testing.

Failed:

- No final smoke test failed. The only blocker is incomplete frontend/auth environment setup.

## Manual actions Sahil must perform

1. Connect the Amplify app to the GitHub repository.
2. Connect/build the branch:

```text
feature/aws-account-setup
```

3. Add the frontend environment variables in Amplify:

```text
NEXT_PUBLIC_API_BASE_URL=https://hdbv2aqjv1.execute-api.ap-south-1.amazonaws.com/test
NEXT_PUBLIC_APP_URL=https://<amplify-branch-url>
NEXT_PUBLIC_AWS_REGION=ap-south-1
NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID=ap-south-1_lUYwsiWWp
NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID=1pm2hoome73cgql0dtp6he374n
```

4. Update Cognito app client callback/logout URLs to the real Amplify branch URL.
5. Replace the placeholder/generated OpenAI test secret value in Secrets Manager before testing real analysis.
6. Use only disposable test users and test journal data.
7. Keep WhatsApp disabled unless a specifically approved test recipient is configured.

## Exact next commands

Check identity:

```bash
aws --profile inner-pause sts get-caller-identity
aws --profile inner-pause configure get region
```

Check health:

```bash
curl -i https://hdbv2aqjv1.execute-api.ap-south-1.amazonaws.com/test/health
```

Check Amplify app:

```bash
aws --profile inner-pause --region ap-south-1 amplify get-app --app-id d2hbf3vde4pxs7
aws --profile inner-pause --region ap-south-1 amplify list-branches --app-id d2hbf3vde4pxs7
```

Check Cognito client:

```bash
aws --profile inner-pause --region ap-south-1 cognito-idp describe-user-pool-client \
  --user-pool-id ap-south-1_lUYwsiWWp \
  --client-id 1pm2hoome73cgql0dtp6he374n
```

After Amplify is connected and Cognito callback URLs are corrected, run browser smoke tests:

```text
1. Open the Amplify branch URL.
2. Sign up with a disposable test email.
3. Confirm the email verification message arrives.
4. Click the verification link.
5. Log in.
6. Create a test journal entry.
7. List journal entries.
8. Log out.
9. Confirm protected pages require login.
10. Repeat with a second disposable test user to confirm cross-user data is isolated.
```

## Final status

The AWS backend test environment is healthy and the private RDS database has been migrated successfully.

The next blocker is frontend hosting/auth wiring in Amplify:

- Amplify is not connected to GitHub.
- Auto-build is off.
- Cognito callback URL is still a placeholder.
- OpenAI test secret value needs manual replacement before real analysis testing.

