# AWS final readiness checklist

## Ready before deployment

- Frontend has a central Cognito auth service and provider.
- Frontend uses public Cognito config only.
- Backend AWS mode refuses mock auth, memory repositories, local storage and mock AI.
- PostgreSQL repository enforces user ownership checks for journals and audio.
- Analysis worker persists structured insight results.
- SQS worker handlers return partial batch failure responses.
- CDK defines private RDS, RDS Proxy, private S3, Cognito, API Gateway, SQS queues, DLQ, EventBridge and CloudWatch alarms.
- Safe migration runner exists and refuses production-looking targets by default.
- Secret scan script exists.

## Requires AWS deployment

- Verify Cognito sign-up, confirmation, sign-in, refresh and sign-out against the real user pool.
- Verify API Gateway routes with real Cognito tokens.
- Run PostgreSQL migrations against the AWS test database.
- Verify SQS queue delivery and Lambda event-source mappings.
- Verify OpenAI analysis worker persistence with fake test journal content.
- Verify CloudWatch logs contain only safe IDs.
- Verify S3 signed playback URLs after a real audio provider is selected.
- Verify cross-user denial against two real Cognito test users.
- Verify DLQ behaviour by intentionally causing a test worker failure.

## Blocked

- Real reset-audio generation is blocked until a final audio provider is selected and configured.
- WhatsApp delivery is blocked unless a real provider and `APPROVED_TEST_RECIPIENT` are configured for test mode.
- CDK currently uses inline Lambda scaffolds. Before a real AWS runtime test, package the compiled backend handlers into Lambda assets or add a bundling step.

## Optional later

- Add richer insight aggregation.
- Add scheduled notification preference UI beyond current API support.
- Add automated end-to-end browser tests against Amplify.
- Add CloudWatch dashboards for owner-friendly monitoring.

