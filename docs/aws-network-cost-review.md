# AWS network and cost review

## Current network design

The CDK stack creates:

- one VPC
- public subnets
- private egress subnets
- isolated database subnets
- one NAT Gateway
- private RDS PostgreSQL
- RDS Proxy
- Lambda functions in the VPC

RDS is not public.

## Why NAT Gateway exists

The Lambdas are inside the VPC so they can reach RDS Proxy privately.

Some Lambdas also need outbound internet access:

- analysis worker needs OpenAI API access
- API Lambda may need Cognito JWKS access for token verification
- future notification worker may need WhatsApp provider access
- future audio provider may need external provider access

Private VPC Lambdas need NAT Gateway or equivalent outbound routing to reach public internet APIs.

## Expected ongoing cost

NAT Gateway has an ongoing hourly cost plus data processing charges.

RDS and RDS Proxy also have ongoing hourly cost.

For a short test deployment, these costs are manageable if the stack is destroyed promptly. For a long-running test environment, they should be reviewed.

## Cheaper test alternatives

Possible alternatives:

- Keep current VPC design for the first safe test, then destroy resources quickly.
- Add VPC endpoints for AWS services such as S3, SQS and Secrets Manager to reduce NAT usage for AWS API calls.
- Split public-internet-only work from database work, but that adds complexity.

## Why not make RDS public

Making RDS public would reduce networking complexity, but it weakens the security model.

Do not make RDS public only to avoid NAT cost.

## Public Lambda plus private database?

A Lambda outside a VPC can reach public internet APIs easily, but it cannot privately reach RDS Proxy in the VPC.

Because the API and workers need PostgreSQL access, they currently stay in the VPC.

## VPC endpoints

VPC endpoints may help later for:

- S3
- SQS
- Secrets Manager
- CloudWatch Logs

They may reduce NAT traffic but can add endpoint hourly costs. For the first review, keep the design simple and document NAT cost clearly.

