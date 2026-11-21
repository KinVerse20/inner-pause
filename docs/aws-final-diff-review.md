# AWS final CDK diff review

Reviewed file:

```text
/Users/sahil/Documents/Healing App/.aws-review/cdk-diff.txt
```

No deployment was run.

## Final recommendation

SAFE TO DEPLOY for a short test deployment, if Sahil accepts the monthly AWS cost risk and destroys the stack promptly after testing.

There are no critical security blockers in the reviewed diff.

## Account and region

- AWS account: confirmed as `777832746097`
- AWS region: confirmed as `ap-south-1`
- Stack name: `InnerPauseAwsTestStack`
- Environment: test

The diff output shows the template being published as:

```text
777832746097-ap-south-1
```

The API output also uses:

```text
execute-api.ap-south-1
```

## 1. AWS services that will be created

The diff shows these services being created:

- Amplify
- Cognito User Pool and User Pool Client
- API Gateway
- Lambda
- SQS queues
- SQS dead-letter queue
- EventBridge scheduled rule
- RDS PostgreSQL
- RDS Proxy
- S3 audio bucket
- Secrets Manager secrets
- CloudWatch log groups
- CloudWatch alarms
- VPC networking
- subnets
- route tables
- Internet Gateway
- NAT Gateway
- Elastic IP
- security groups
- IAM roles and policies

This is a full AWS test environment, not just a frontend deployment.

## 2. Services that can create monthly charges

The main monthly-cost services are:

- NAT Gateway
- RDS PostgreSQL database
- RDS Proxy
- Amplify hosting/builds
- CloudWatch logs
- Secrets Manager
- S3 storage
- API Gateway requests
- Lambda invocations
- SQS requests

The biggest fixed monthly-cost items are NAT Gateway, RDS, and RDS Proxy.

## 3. Estimated test-environment cost range

Estimated if left running for a full month:

```text
Approximately $80 to $150/month
```

The biggest expected pieces are:

- NAT Gateway: roughly $35 to $45/month before data processing
- RDS `db.t4g.micro`: roughly $10 to $20/month, possibly lower if eligible for AWS Free Tier
- RDS Proxy: roughly $20 to $35/month
- Other services: usually low for light testing, but CloudWatch logs, Amplify builds, API Gateway, Lambda, S3, SQS, and Secrets Manager can add smaller usage-based charges

If the stack is deployed only for a few days and then destroyed, the cost should be much lower.

AWS pricing changes by region and over time. AWS documents that NAT Gateway charges are hourly plus per-GB processing, and RDS/RDS Proxy are billed by provisioned database/proxy capacity. See the official AWS pricing pages before leaving the stack running:

- https://aws.amazon.com/vpc/pricing/
- https://aws.amazon.com/rds/postgresql/pricing/
- https://aws.amazon.com/rds/proxy/pricing/

## 4. NAT Gateway review

Yes, a NAT Gateway is included.

The diff shows:

```text
AWS::EC2::NatGateway InnerPauseTestVpc/publicSubnet1/NATGateway
```

Why it exists:

- The Lambda functions are inside the VPC so they can reach the private RDS Proxy.
- The analysis worker needs outbound internet access for OpenAI.
- Cognito JWT verification may need outbound access to Cognito public keys.
- Future WhatsApp/audio providers may also need outbound internet access.

Can it be avoided safely?

Not safely without redesigning the architecture.

The safer current design keeps RDS private. Removing NAT while keeping Lambdas private would break outbound calls to OpenAI/Cognito unless VPC endpoints or another architecture is added. Making RDS public just to avoid NAT cost is not recommended.

Possible later cost optimisations:

- Add VPC endpoints for AWS services such as S3, SQS and Secrets Manager.
- Split internet-only work from database work.
- Destroy the test stack when not actively testing.

For the first test deployment, NAT Gateway is acceptable but cost-sensitive.

## 5. RDS privacy

RDS is private.

The generated template shows:

```text
PubliclyAccessible: false
```

The database is placed behind RDS Proxy and private VPC networking.

## 6. S3 public access

S3 public access is blocked.

The generated template shows:

```text
BlockPublicAcls: true
BlockPublicPolicy: true
IgnorePublicAcls: true
RestrictPublicBuckets: true
```

The bucket also has an HTTPS-only deny policy.

## 7. Database access from `0.0.0.0/0`

No database access from `0.0.0.0/0` was found.

Database ingress allows PostgreSQL only from:

- the Lambda security group
- the database/proxy security group relationship used by RDS Proxy

The diff does show `0.0.0.0/0` for internet routing and Lambda outbound traffic. That is not database inbound access.

## 8. IAM permissions

No wildcard `AdministratorAccess` was found.

No permanent administrator policy was found.

The diff includes normal service roles and managed policies:

- `AWSLambdaBasicExecutionRole`
- `AWSLambdaVPCAccessExecutionRole`
- `AmazonAPIGatewayPushToCloudWatchLogs`

The Lambda VPC managed policy is broad because AWS Lambda needs network-interface permissions to run inside a VPC. This is normal for VPC Lambdas.

The S3 bucket policy contains `s3:*`, but only inside a deny statement that blocks insecure non-HTTPS access. That is a protective policy, not broad write access.

Application permissions look scoped to specific resources:

- API Lambda can send messages to the app queues.
- Workers can consume their own queues.
- Workers/API can connect to the RDS Proxy database user.
- Analysis worker can read the OpenAI secret.
- Audio worker can put private objects into the audio bucket.

## 9. Secrets in the template

No real secret values were found directly in the template.

The template creates Secrets Manager secrets and uses dynamic references.

Examples:

- database password is generated by Secrets Manager
- OpenAI secret is generated as a placeholder secret
- Lambda receives secret ARNs/references, not the actual secret value

Important follow-up:

Before testing real analysis, replace the generated OpenAI secret value in AWS Secrets Manager with the real OpenAI API key. Do not put the key in Git, frontend code, or CloudFormation.

## 10. Destructive changes

No destructive changes were found in the diff.

The resource list is all additions:

```text
[+]
```

No deletions or replacements were found.

This makes sense because this is the first application stack deployment.

## 11. Things to fix before deployment

No critical code or infrastructure fix is required before deployment.

Required before running the app test:

1. Confirm the AWS account one more time before bootstrap/deploy.
2. Confirm the region is still `ap-south-1`.
3. Accept the NAT Gateway/RDS/RDS Proxy cost risk.
4. Set a reminder to destroy the stack after testing.
5. After deployment, replace the generated OpenAI secret with the real key before testing emotional analysis.

Optional improvement before deployment:

- Add VPC endpoints later to reduce NAT usage for AWS service calls. This is not required for the first test.

## 12. Security red flags checklist

- Public RDS: not found
- Public S3: not found
- Database access from `0.0.0.0/0`: not found
- Wildcard AdministratorAccess: not found
- Secrets embedded directly in template: not found
- Unexpected account: not found
- Unexpected region: not found
- Destructive replacement/deletion: not found
- NAT Gateway: present and cost-sensitive, but expected in this architecture

## Final decision

SAFE TO DEPLOY

Reason:

The diff targets the correct account and region, creates only new test resources, keeps RDS private, blocks S3 public access, avoids embedded secrets, and does not show destructive changes.

The main caution is cost, especially NAT Gateway, RDS, and RDS Proxy. Deploy only when ready to test, and destroy the test stack when finished.

