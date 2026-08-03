import * as cdk from "aws-cdk-lib";
import { Duration, RemovalPolicy, Stack, StackProps, Tags } from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as amplify from "aws-cdk-lib/aws-amplify";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as eventSources from "aws-cdk-lib/aws-lambda-event-sources";
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
      branchName: "feature/aws-deployment-ready",
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

    const analysisQueue = new sqs.Queue(this, "InnerPauseAnalysisQueue", {
      visibilityTimeout: Duration.seconds(90),
      retentionPeriod: Duration.days(4),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      deadLetterQueue: {
        queue: deadLetterQueue,
        maxReceiveCount: 3,
      },
    });

    const audioQueue = new sqs.Queue(this, "InnerPauseAudioQueue", {
      visibilityTimeout: Duration.seconds(180),
      retentionPeriod: Duration.days(4),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      deadLetterQueue: {
        queue: deadLetterQueue,
        maxReceiveCount: 3,
      },
    });

    const notificationQueue = new sqs.Queue(this, "InnerPauseNotificationQueue", {
      visibilityTimeout: Duration.seconds(60),
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
      AWS_DATABASE_PROXY_ENDPOINT: proxy.endpoint,
      AWS_AUDIO_BUCKET_NAME: audioBucket.bucketName,
      AWS_COGNITO_USER_POOL_ID: userPool.userPoolId,
      AWS_COGNITO_USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      AWS_ANALYSIS_QUEUE_URL: analysisQueue.queueUrl,
      AWS_AUDIO_QUEUE_URL: audioQueue.queueUrl,
      AWS_NOTIFICATION_QUEUE_URL: notificationQueue.queueUrl,
      BACKEND_RUNTIME_MODE: "aws",
      AUTH_MODE: "cognito",
      REPOSITORY_MODE: "postgres",
      STORAGE_MODE: "s3",
      AI_MODE: "openai",
      NOTIFICATIONS_MODE: "disabled",
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

    const analysisWorkerLogGroup = new logs.LogGroup(this, "InnerPauseAnalysisWorkerLogGroup", {
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const analysisWorkerHandler = new lambda.Function(this, "InnerPauseAnalysisWorkerHandler", {
      runtime: lambdaRuntime,
      handler: "index.handler",
      timeout: Duration.seconds(60),
      memorySize: 256,
      logGroup: analysisWorkerLogGroup,
      vpc,
      securityGroups: [lambdaSecurityGroup],
      environment: lambdaEnvironment,
      code: lambda.Code.fromInline(`
exports.handler = async (event) => {
  console.log("InnerPause analysis worker scaffold received", { records: event.Records?.length || 0 });
  return { batchItemFailures: [] };
};
      `),
    });

    const audioWorkerHandler = new lambda.Function(this, "InnerPauseAudioWorkerHandler", {
      runtime: lambdaRuntime,
      handler: "index.handler",
      timeout: Duration.seconds(120),
      memorySize: 512,
      logGroup: new logs.LogGroup(this, "InnerPauseAudioWorkerLogGroup", {
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: RemovalPolicy.DESTROY,
      }),
      vpc,
      securityGroups: [lambdaSecurityGroup],
      environment: lambdaEnvironment,
      code: lambda.Code.fromInline(`
exports.handler = async (event) => {
  console.log("InnerPause audio worker scaffold received", { records: event.Records?.length || 0 });
  return { batchItemFailures: [] };
};
      `),
    });

    const notificationWorkerHandler = new lambda.Function(this, "InnerPauseNotificationWorkerHandler", {
      runtime: lambdaRuntime,
      handler: "index.handler",
      timeout: Duration.seconds(45),
      memorySize: 256,
      logGroup: new logs.LogGroup(this, "InnerPauseNotificationWorkerLogGroup", {
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: RemovalPolicy.DESTROY,
      }),
      vpc,
      securityGroups: [lambdaSecurityGroup],
      environment: lambdaEnvironment,
      code: lambda.Code.fromInline(`
exports.handler = async (event) => {
  console.log("InnerPause notification worker scaffold received", { records: event.Records?.length || 0 });
  return { batchItemFailures: [] };
};
      `),
    });

    analysisWorkerHandler.addEventSource(new eventSources.SqsEventSource(analysisQueue, { batchSize: 5, reportBatchItemFailures: true }));
    audioWorkerHandler.addEventSource(new eventSources.SqsEventSource(audioQueue, { batchSize: 2, reportBatchItemFailures: true }));
    notificationWorkerHandler.addEventSource(new eventSources.SqsEventSource(notificationQueue, { batchSize: 10, reportBatchItemFailures: true }));

    database.secret!.grantRead(apiHandler);
    database.secret!.grantRead(analysisWorkerHandler);
    database.secret!.grantRead(audioWorkerHandler);
    database.secret!.grantRead(notificationWorkerHandler);
    proxy.grantConnect(apiHandler, "innerpause_admin");
    proxy.grantConnect(analysisWorkerHandler, "innerpause_admin");
    proxy.grantConnect(audioWorkerHandler, "innerpause_admin");
    proxy.grantConnect(notificationWorkerHandler, "innerpause_admin");
    audioBucket.grantReadWrite(apiHandler);
    audioBucket.grantReadWrite(audioWorkerHandler);
    analysisQueue.grantSendMessages(apiHandler);
    audioQueue.grantSendMessages(apiHandler);
    notificationQueue.grantSendMessages(apiHandler);
    analysisQueue.grantConsumeMessages(analysisWorkerHandler);
    audioQueue.grantConsumeMessages(audioWorkerHandler);
    notificationQueue.grantConsumeMessages(notificationWorkerHandler);

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
    const apiResource = api.root.addResource("api");
    const v1Resource = apiResource.addResource("v1");
    v1Resource.addProxy({
      anyMethod: true,
      defaultIntegration: lambdaIntegration,
      defaultCorsPreflightOptions: {
        allowOrigins: allowedFrontendOrigins,
        allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowHeaders: ["content-type", "authorization", "idempotency-key", "x-request-id"],
        allowCredentials: true,
      },
    });

    new events.Rule(this, "MorningGuidanceSchedule", {
      schedule: events.Schedule.rate(Duration.hours(24)),
      targets: [new targets.SqsQueue(notificationQueue)],
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
    new cdk.CfnOutput(this, "DatabaseSecretName", { value: database.secret!.secretName });
    new cdk.CfnOutput(this, "AnalysisQueueUrl", { value: analysisQueue.queueUrl });
    new cdk.CfnOutput(this, "AudioQueueUrl", { value: audioQueue.queueUrl });
    new cdk.CfnOutput(this, "NotificationQueueUrl", { value: notificationQueue.queueUrl });
    new cdk.CfnOutput(this, "DeadLetterQueueUrl", { value: deadLetterQueue.queueUrl });
  }
}
