# AWS CDK diff review checklist

Run this before `cdk bootstrap` or `cdk diff`:

```bash
cd "/Users/sahil/Documents/Healing App"
npm run aws:verify
```

## Expected services

The diff may show:

- Amplify
- Cognito
- API Gateway
- Lambda
- SQS and DLQ
- EventBridge
- RDS PostgreSQL
- RDS Proxy
- S3
- Secrets Manager
- CloudWatch

## Cost-sensitive services

Pay close attention to:

- RDS database
- RDS Proxy
- NAT Gateway
- VPC endpoints if added later
- Amplify build and hosting
- CloudWatch log storage

NAT Gateway and RDS/RDS Proxy are the main ongoing hourly cost items in the current design.

## Security red flags

Stop if the diff shows:

- public RDS
- public S3
- `0.0.0.0/0` database access
- wildcard administrator permissions
- secrets written directly into templates
- root-user credentials
- unexpected region
- unexpected AWS account
- production resource names
- unnecessary extra NAT Gateways
- destructive replacement of existing resources

## Expected safe settings

- Region should be `ap-south-1`.
- Stack name should be `InnerPauseAwsTestStack`.
- Resources should be tagged as `Environment=test`.
- RDS should be private.
- S3 should block public access.
- Lambda code should be bundled assets, not inline `ZipFile` code.
- Secrets should be referenced by ARN/name, not embedded values.

