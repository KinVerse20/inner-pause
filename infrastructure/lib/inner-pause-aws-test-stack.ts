import * as cdk from "aws-cdk-lib";
import { Duration, RemovalPolicy, Stack, StackProps, Tags } from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as amplify from "aws-cdk-lib/aws-amplify";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as rds from "aws-cdk-lib/aws-rds";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";

const lambdaRuntime = lambda.Runtime.NODEJS_24_X;

export class InnerPauseAwsTestStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    Tags.of(this).add("Project", "TheInnerPause");
    Tags.of(this).add("Environment", "test");
    Tags.of(this).add("ManagedBy", "cdk");

    const allowedFrontendOrigins = this.node.tryGetContext("allowedFrontendOrigins") ?? [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://feature-aws-separated-frontend-backend.example.amplifyapp.com",
    ];

    const frontendApp = new amplify.CfnApp(this, "InnerPauseAmplifyTestApp", {
      name: "innerpause-aws-separated-test",
      description: "Isolated AWS test frontend for The InnerPause. Connect repository manually before deployment.",
      platform: "WEB_COMPUTE",
      customRules: [
        {
          source: "/<*>",
          target: "/index.html",
          status: "404-200",
        },
      ],
    });

    new amplify.CfnBranch(this, "InnerPauseAmplifyTestBranch", {
      appId: frontendApp.attrAppId,
      branchName: "feature/aws-separated-frontend-backend",
      enableAutoBuild: false,
      stage: "DEVELOPMENT",
    });

    const vpc = new ec2.Vpc(this, "InnerPauseTestVpc", {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        { name: "public", subnetType: ec2.SubnetType.PUBLIC },
        { name: "private-egress", subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        { name: "isolated-db", subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      ],
    });

    const databaseSecurityGroup = new ec2.SecurityGroup(this, "DatabaseSecurityGroup", {
      vpc,
      allowAllOutbound: false,
      description: "Allows database access from Lambda and RDS Proxy only.",
    });

    const lambdaSecurityGroup = new ec2.SecurityGroup(this, "LambdaSecurityGroup", {
      vpc,
      allowAllOutbound: true,
      description: "Outbound access for API and job Lambdas.",
    });

    databaseSecurityGroup.addIngressRule(lambdaSecurityGroup, ec2.Port.tcp(5432), "Lambda to PostgreSQL");

    const database = new rds.DatabaseInstance(this, "InnerPauseTestDatabase", {
      vpc,
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_16_3 }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      databaseName: "innerpause_test",
      credentials: rds.Credentials.fromGeneratedSecret("innerpause_admin"),
      multiAz: false,
      publiclyAccessible: false,
      storageEncrypted: true,
      backupRetention: Duration.days(3),
      deletionProtection: false,
      securityGroups: [databaseSecurityGroup],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const proxy = database.addProxy("InnerPauseTestRdsProxy", {
      secrets: [database.secret!],
      vpc,
      securityGroups: [databaseSecurityGroup],
      requireTLS: true,
      iamAuth: true,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    const userPool = new cognito.UserPool(this, "InnerPauseTestUserPool", {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
        fullname: { required: false, mutable: true },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: false,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const userPoolClient = userPool.addClient("InnerPauseTestWebClient", {
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      preventUserExistenceErrors: true,
      accessTokenValidity: Duration.minutes(60),
      idTokenValidity: Duration.minutes(60),
      refreshTokenValidity: Duration.days(30),
    });

    const audioBucket = new s3.Bucket(this, "InnerPauseTestAudioBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const deadLetterQueue = new sqs.Queue(this, "InnerPauseDeadLetterQueue", {
      retentionPeriod: Duration.days(14),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
    });

    const workQueue = new sqs.Queue(this, "InnerPauseWorkQueue", {
      visibilityTimeout: Duration.seconds(90),
      retentionPeriod: Duration.days(4),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      deadLetterQueue: {
        queue: deadLetterQueue,
        maxReceiveCount: 3,
      },
    });

    const lambdaEnvironment = {
      INFRASTRUCTURE_PROVIDER: "aws",
      DATABASE_NAME: "innerpause_test",
      DATABASE_PROXY_ENDPOINT: proxy.endpoint,
      AUDIO_BUCKET_NAME: audioBucket.bucketName,
      USER_POOL_ID: userPool.userPoolId,
      USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      WORK_QUEUE_URL: workQueue.queueUrl,
    };

    const apiLogGroup = new logs.LogGroup(this, "InnerPauseApiHandlerLogGroup", {
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const apiHandler = new lambda.Function(this, "InnerPauseApiHandler", {
      runtime: lambdaRuntime,
      handler: "index.handler",
      timeout: Duration.seconds(20),
      memorySize: 256,
      logGroup: apiLogGroup,
      vpc,
      securityGroups: [lambdaSecurityGroup],
      environment: lambdaEnvironment,
      code: lambda.Code.fromInline(`
exports.handler = async (event) => {
  const path = event.path || event.rawPath || "/";
  if (path.endsWith("/health")) {
    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: true, service: "innerpause-aws-test" })
    };
  }
  return {
    statusCode: 501,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ error: "AWS test API handler scaffold. No production behavior is active." })
  };
};
      `),
    });

    const workerLogGroup = new logs.LogGroup(this, "InnerPauseWorkerHandlerLogGroup", {
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const workerHandler = new lambda.Function(this, "InnerPauseWorkerHandler", {
      runtime: lambdaRuntime,
      handler: "index.handler",
      timeout: Duration.seconds(60),
      memorySize: 256,
      logGroup: workerLogGroup,
      vpc,
      securityGroups: [lambdaSecurityGroup],
      environment: lambdaEnvironment,
      code: lambda.Code.fromInline(`
exports.handler = async (event) => {
  console.log("InnerPause AWS test worker received", JSON.stringify(event));
  return { ok: true };
};
      `),
    });

    database.secret!.grantRead(apiHandler);
    database.secret!.grantRead(workerHandler);
    proxy.grantConnect(apiHandler, "innerpause_admin");
    proxy.grantConnect(workerHandler, "innerpause_admin");
    audioBucket.grantReadWrite(apiHandler);
    audioBucket.grantReadWrite(workerHandler);
    workQueue.grantSendMessages(apiHandler);
    workQueue.grantConsumeMessages(workerHandler);

    apiHandler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["rds-db:connect"],
        resources: ["*"],
      }),
    );

    const api = new apigateway.RestApi(this, "InnerPauseTestApi", {
      restApiName: "innerpause-aws-test-api",
      deployOptions: {
        stageName: "test",
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: false,
        metricsEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: allowedFrontendOrigins,
        allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowHeaders: ["content-type", "authorization"],
        allowCredentials: true,
      },
    });

    const lambdaIntegration = new apigateway.LambdaIntegration(apiHandler);
    api.root.addResource("health").addMethod("GET", lambdaIntegration);
    api.root.addResource("analyze").addMethod("POST", lambdaIntegration);
    api.root.addResource("profile").addMethod("ANY", lambdaIntegration);
    api.root.addResource("journal").addMethod("ANY", lambdaIntegration);
    api.root.addResource("healing").addMethod("ANY", lambdaIntegration);

    new events.Rule(this, "MorningGuidanceSchedule", {
      schedule: events.Schedule.rate(Duration.hours(24)),
      targets: [new targets.SqsQueue(workQueue)],
    });

    new cloudwatch.Alarm(this, "ApiErrorsAlarm", {
      metric: api.metricServerError(),
      threshold: 5,
      evaluationPeriods: 1,
    });

    new cloudwatch.Alarm(this, "DeadLetterQueueAlarm", {
      metric: deadLetterQueue.metricApproximateNumberOfMessagesVisible(),
      threshold: 1,
      evaluationPeriods: 1,
    });

    new cdk.CfnOutput(this, "ApiBaseUrl", { value: api.url });
    new cdk.CfnOutput(this, "AmplifyAppId", { value: frontendApp.attrAppId });
    new cdk.CfnOutput(this, "AwsRegion", { value: Stack.of(this).region });
    new cdk.CfnOutput(this, "UserPoolId", { value: userPool.userPoolId });
    new cdk.CfnOutput(this, "UserPoolClientId", { value: userPoolClient.userPoolClientId });
    new cdk.CfnOutput(this, "AudioBucketName", { value: audioBucket.bucketName });
    new cdk.CfnOutput(this, "DatabaseProxyEndpoint", { value: proxy.endpoint });
  }
}
