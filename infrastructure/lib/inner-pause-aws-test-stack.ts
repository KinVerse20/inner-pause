import * as cdk from "aws-cdk-lib";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Duration, RemovalPolicy, Stack, StackProps, Tags } from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as eventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as rds from "aws-cdk-lib/aws-rds";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";

const lambdaRuntime = lambda.Runtime.NODEJS_22_X;
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export class InnerPauseAwsTestStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    Tags.of(this).add("Project", "TheInnerPause");
    Tags.of(this).add("Environment", "test");
    Tags.of(this).add("ManagedBy", "cdk");

    const frontendUrl = String(
      this.node.tryGetContext("frontendUrl") ?? "https://feature-aws-account-setup.d3mrns75cpzj85.amplifyapp.com",
    ).replace(/\/$/, "");
    const allowedFrontendOriginsInput = this.node.tryGetContext("allowedFrontendOrigins") ?? [
      "http://localhost:3000",
      "http://localhost:3001",
      frontendUrl,
    ];
    const allowedFrontendOrigins = Array.isArray(allowedFrontendOriginsInput)
      ? allowedFrontendOriginsInput
      : String(allowedFrontendOriginsInput)
          .split(",")
          .map((origin) => origin.trim())
          .filter(Boolean);

    const vpc = new ec2.Vpc(this, "InnerPauseTestVpc", {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        { name: "public", subnetType: ec2.SubnetType.PUBLIC },
        { name: "isolated-db", subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      ],
    });

    vpc.addGatewayEndpoint("InnerPauseS3Endpoint", {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [{ subnetType: ec2.SubnetType.PRIVATE_ISOLATED }],
    });

    const databaseSecurityGroup = new ec2.SecurityGroup(this, "DatabaseSecurityGroup", {
      vpc,
      allowAllOutbound: false,
      description: "Allows database access from private Lambda functions only.",
    });

    const lambdaSecurityGroup = new ec2.SecurityGroup(this, "LambdaSecurityGroup", {
      vpc,
      allowAllOutbound: true,
      description: "Outbound access for API and job Lambdas.",
    });

    databaseSecurityGroup.addIngressRule(lambdaSecurityGroup, ec2.Port.tcp(5432), "Lambda to PostgreSQL");

    const database = new rds.DatabaseInstance(this, "InnerPauseTestDatabase", {
      vpc,
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.of("16.14", "16") }),
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

    const adminGroup = new cognito.CfnUserPoolGroup(this, "InnerPauseAdminGroup", {
      userPoolId: userPool.userPoolId,
      groupName: "InnerPauseAdmins",
      description: "Approved administrators for The Inner Pause AWS test Admin Control Room.",
      precedence: 1,
    });

    const audioBucket = new s3.Bucket(this, "InnerPauseTestAudioBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const openAiSecret = new secretsmanager.Secret(this, "InnerPauseOpenAiSecret", {
      description: "OpenAI API key for The InnerPause AWS test analysis worker. Replace generated value before testing analysis.",
      generateSecretString: {
        secretStringTemplate: JSON.stringify({}),
        generateStringKey: "OPENAI_API_KEY",
      },
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
      DATABASE_USER: "innerpause_admin",
      DATABASE_PORT: "5432",
      DATABASE_SSL: "true",
      DATABASE_IAM_AUTH: "true",
      AWS_DATABASE_ENDPOINT: database.instanceEndpoint.hostname,
      AWS_DATABASE_SECRET_ARN: database.secret!.secretArn,
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
      OPENAI_API_KEY_SECRET_ARN: openAiSecret.secretArn,
      OPENAI_MODEL: "gpt-4.1-mini",
      NOTIFICATIONS_MODE: "disabled",
      ALLOWED_ORIGINS: allowedFrontendOrigins.join(","),
    };

    const apiLogGroup = new logs.LogGroup(this, "InnerPauseApiHandlerLogGroup", {
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const commonNodeBundling: nodejs.BundlingOptions = {
      target: "node22",
      sourceMap: true,
      minify: false,
      keepNames: true,
      externalModules: [],
    };

    const apiHandler = new nodejs.NodejsFunction(this, "InnerPauseApiHandler", {
      runtime: lambdaRuntime,
      entry: path.join(repoRoot, "backend/src/handlers/api.ts"),
      handler: "handler",
      timeout: Duration.seconds(20),
      memorySize: 256,
      architecture: lambda.Architecture.ARM_64,
      logGroup: apiLogGroup,
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [lambdaSecurityGroup],
      environment: lambdaEnvironment,
      depsLockFilePath: path.join(repoRoot, "backend/package-lock.json"),
      projectRoot: repoRoot,
      bundling: commonNodeBundling,
    });

    const internalDbHandler = new nodejs.NodejsFunction(this, "InnerPausePrivateDbHandler", {
      runtime: lambdaRuntime,
      entry: path.join(repoRoot, "backend/src/handlers/internal-db.ts"),
      handler: "handler",
      timeout: Duration.seconds(20),
      memorySize: 256,
      architecture: lambda.Architecture.ARM_64,
      logGroup: new logs.LogGroup(this, "InnerPausePrivateDbHandlerLogGroup", {
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: RemovalPolicy.DESTROY,
      }),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [lambdaSecurityGroup],
      environment: lambdaEnvironment,
      depsLockFilePath: path.join(repoRoot, "backend/package-lock.json"),
      projectRoot: repoRoot,
      bundling: commonNodeBundling,
    });

    const publicApiHandler = new nodejs.NodejsFunction(this, "InnerPausePublicApiHandler", {
      runtime: lambdaRuntime,
      entry: path.join(repoRoot, "backend/src/handlers/public-api.ts"),
      handler: "handler",
      timeout: Duration.seconds(20),
      memorySize: 256,
      architecture: lambda.Architecture.ARM_64,
      logGroup: new logs.LogGroup(this, "InnerPausePublicApiHandlerLogGroup", {
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: RemovalPolicy.DESTROY,
      }),
      environment: lambdaEnvironment,
      depsLockFilePath: path.join(repoRoot, "backend/package-lock.json"),
      projectRoot: repoRoot,
      bundling: commonNodeBundling,
    });

    const analysisWorkerLogGroup = new logs.LogGroup(this, "InnerPauseAnalysisWorkerLogGroup", {
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const analysisWorkerHandler = new nodejs.NodejsFunction(this, "InnerPauseAnalysisWorkerHandler", {
      runtime: lambdaRuntime,
      entry: path.join(repoRoot, "backend/src/handlers/sqs-workers.ts"),
      handler: "analysisQueueHandler",
      timeout: Duration.seconds(60),
      memorySize: 256,
      architecture: lambda.Architecture.ARM_64,
      logGroup: analysisWorkerLogGroup,
      environment: lambdaEnvironment,
      depsLockFilePath: path.join(repoRoot, "backend/package-lock.json"),
      projectRoot: repoRoot,
      bundling: commonNodeBundling,
    });

    const audioWorkerHandler = new nodejs.NodejsFunction(this, "InnerPauseAudioWorkerHandler", {
      runtime: lambdaRuntime,
      entry: path.join(repoRoot, "backend/src/handlers/sqs-workers.ts"),
      handler: "audioQueueHandler",
      timeout: Duration.seconds(120),
      memorySize: 512,
      architecture: lambda.Architecture.ARM_64,
      logGroup: new logs.LogGroup(this, "InnerPauseAudioWorkerLogGroup", {
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: RemovalPolicy.DESTROY,
      }),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [lambdaSecurityGroup],
      environment: lambdaEnvironment,
      depsLockFilePath: path.join(repoRoot, "backend/package-lock.json"),
      projectRoot: repoRoot,
      bundling: commonNodeBundling,
    });

    const notificationWorkerHandler = new nodejs.NodejsFunction(this, "InnerPauseNotificationWorkerHandler", {
      runtime: lambdaRuntime,
      entry: path.join(repoRoot, "backend/src/handlers/sqs-workers.ts"),
      handler: "notificationQueueHandler",
      timeout: Duration.seconds(45),
      memorySize: 256,
      architecture: lambda.Architecture.ARM_64,
      logGroup: new logs.LogGroup(this, "InnerPauseNotificationWorkerLogGroup", {
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: RemovalPolicy.DESTROY,
      }),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [lambdaSecurityGroup],
      environment: lambdaEnvironment,
      depsLockFilePath: path.join(repoRoot, "backend/package-lock.json"),
      projectRoot: repoRoot,
      bundling: commonNodeBundling,
    });

    const scheduleHandler = new nodejs.NodejsFunction(this, "InnerPauseScheduleHandler", {
      runtime: lambdaRuntime,
      entry: path.join(repoRoot, "backend/src/handlers/schedule.ts"),
      handler: "handler",
      timeout: Duration.seconds(30),
      memorySize: 256,
      architecture: lambda.Architecture.ARM_64,
      logGroup: new logs.LogGroup(this, "InnerPauseScheduleHandlerLogGroup", {
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: RemovalPolicy.DESTROY,
      }),
      environment: lambdaEnvironment,
      depsLockFilePath: path.join(repoRoot, "backend/package-lock.json"),
      projectRoot: repoRoot,
      bundling: commonNodeBundling,
    });

    analysisWorkerHandler.addEventSource(new eventSources.SqsEventSource(analysisQueue, { batchSize: 5, reportBatchItemFailures: true }));
    audioWorkerHandler.addEventSource(new eventSources.SqsEventSource(audioQueue, { batchSize: 2, reportBatchItemFailures: true }));
    notificationWorkerHandler.addEventSource(new eventSources.SqsEventSource(notificationQueue, { batchSize: 10, reportBatchItemFailures: true }));

    openAiSecret.grantRead(publicApiHandler);
    openAiSecret.grantRead(analysisWorkerHandler);
    audioBucket.grantPut(audioWorkerHandler);
    analysisQueue.grantSendMessages(publicApiHandler);
    audioQueue.grantSendMessages(publicApiHandler);
    analysisQueue.grantConsumeMessages(analysisWorkerHandler);
    audioQueue.grantConsumeMessages(audioWorkerHandler);
    notificationQueue.grantConsumeMessages(notificationWorkerHandler);
    internalDbHandler.grantInvoke(publicApiHandler);
    internalDbHandler.grantInvoke(analysisWorkerHandler);

    publicApiHandler.addEnvironment("AWS_PRIVATE_DB_LAMBDA_NAME", internalDbHandler.functionName);
    analysisWorkerHandler.addEnvironment("AWS_PRIVATE_DB_LAMBDA_NAME", internalDbHandler.functionName);

    publicApiHandler.addToRolePolicy(
      new iam.PolicyStatement({
        sid: "AdminReadCloudWatchStatus",
        actions: ["cloudwatch:DescribeAlarms", "cloudwatch:GetMetricStatistics", "cloudwatch:ListMetrics"],
        resources: ["*"],
      }),
    );
    publicApiHandler.addToRolePolicy(
      new iam.PolicyStatement({
        sid: "AdminReadCostExplorer",
        actions: ["ce:GetCostAndUsage"],
        resources: ["*"],
      }),
    );
    publicApiHandler.addToRolePolicy(
      new iam.PolicyStatement({
        sid: "AdminReadRdsStatus",
        actions: ["rds:DescribeDBInstances", "rds:DescribeDBSnapshots"],
        resources: ["*"],
      }),
    );
    publicApiHandler.addToRolePolicy(
      new iam.PolicyStatement({
        sid: "AdminReadCognitoStatus",
        actions: ["cognito-idp:ListUsers"],
        resources: [userPool.userPoolArn],
      }),
    );
    publicApiHandler.addToRolePolicy(
      new iam.PolicyStatement({
        sid: "AdminReadQueueStatus",
        actions: ["sqs:GetQueueAttributes"],
        resources: [deadLetterQueue.queueArn],
      }),
    );
    publicApiHandler.addToRolePolicy(
      new iam.PolicyStatement({
        sid: "AdminReadS3PublicAccessStatus",
        actions: ["s3:GetBucketPublicAccessBlock", "s3:GetBucketPolicyStatus", "s3:ListBucket"],
        resources: [audioBucket.bucketArn],
      }),
    );
    publicApiHandler.addToRolePolicy(
      new iam.PolicyStatement({
        sid: "AdminReadAccessAnalyzer",
        actions: ["access-analyzer:ListFindings"],
        resources: ["*"],
      }),
    );
    publicApiHandler.addToRolePolicy(
      new iam.PolicyStatement({
        sid: "AdminReadBackupStatus",
        actions: ["backup:ListRecoveryPointsByBackupVault"],
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
        allowHeaders: ["content-type", "authorization", "idempotency-key", "x-request-id"],
        allowCredentials: true,
      },
    });

    const corsOptions: apigateway.CorsOptions = {
      allowOrigins: allowedFrontendOrigins,
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["content-type", "authorization", "idempotency-key", "x-request-id"],
      allowCredentials: true,
    };

    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, "InnerPauseApiAuthorizer", {
      cognitoUserPools: [userPool],
    });
    const protectedMethodOptions: apigateway.MethodOptions = {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    };

    const privateLambdaIntegration = new apigateway.LambdaIntegration(apiHandler);
    const publicLambdaIntegration = new apigateway.LambdaIntegration(publicApiHandler);
    apiHandler.addEnvironment("ADMIN_GROUP_NAME", adminGroup.groupName!);
    apiHandler.addEnvironment("AWS_DATABASE_IDENTIFIER", database.instanceIdentifier);
    apiHandler.addEnvironment("AWS_DEAD_LETTER_QUEUE_URL", deadLetterQueue.queueUrl);
    apiHandler.addEnvironment("AWS_FRONTEND_URL", frontendUrl);
    apiHandler.addEnvironment("AWS_API_ID", api.restApiId);
    apiHandler.addEnvironment("AWS_API_NAME", "innerpause-aws-test-api");
    apiHandler.addEnvironment("AWS_API_STAGE", "test");
    apiHandler.addEnvironment("AWS_MONTHLY_BUDGET_AMOUNT", "25");
    publicApiHandler.addEnvironment("ADMIN_GROUP_NAME", adminGroup.groupName!);
    publicApiHandler.addEnvironment("AWS_DATABASE_IDENTIFIER", database.instanceIdentifier);
    publicApiHandler.addEnvironment("AWS_DEAD_LETTER_QUEUE_URL", deadLetterQueue.queueUrl);
    publicApiHandler.addEnvironment("AWS_FRONTEND_URL", frontendUrl);
    publicApiHandler.addEnvironment("AWS_API_ID", api.restApiId);
    publicApiHandler.addEnvironment("AWS_API_NAME", "innerpause-aws-test-api");
    publicApiHandler.addEnvironment("AWS_API_STAGE", "test");
    publicApiHandler.addEnvironment("AWS_MONTHLY_BUDGET_AMOUNT", "25");
    api.root.addResource("health").addMethod("GET", publicLambdaIntegration);
    const apiResource = api.root.addResource("api");
    const v1Resource = apiResource.addResource("v1");
    const v1Health = v1Resource.addResource("health");
    v1Health.addMethod("GET", publicLambdaIntegration);
    const analysisResource = v1Resource.addResource("analysis");
    const analysisQuickResource = analysisResource.addResource("quick");
    analysisQuickResource.addMethod("POST", publicLambdaIntegration, protectedMethodOptions);
    const adminResource = v1Resource.addResource("admin");
    adminResource.addProxy({
      anyMethod: true,
      defaultIntegration: publicLambdaIntegration,
      defaultMethodOptions: protectedMethodOptions,
      defaultCorsPreflightOptions: corsOptions,
    });
    const journalsResource = v1Resource.addResource("journals");
    const journalIdResource = journalsResource.addResource("{journalId}");
    const analyseJobResource = journalIdResource.addResource("analyse");
    analyseJobResource.addMethod("POST", publicLambdaIntegration, protectedMethodOptions);
    const resetAudioJobResource = journalIdResource.addResource("reset-audio");
    resetAudioJobResource.addMethod("POST", publicLambdaIntegration, protectedMethodOptions);
    v1Resource.addProxy({
      anyMethod: true,
      defaultIntegration: privateLambdaIntegration,
      defaultMethodOptions: protectedMethodOptions,
      defaultCorsPreflightOptions: corsOptions,
    });

    new events.Rule(this, "MorningGuidanceSchedule", {
      schedule: events.Schedule.rate(Duration.hours(24)),
      targets: [new targets.LambdaFunction(scheduleHandler)],
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
    new cdk.CfnOutput(this, "FrontendUrl", { value: frontendUrl });
    new cdk.CfnOutput(this, "AwsRegion", { value: Stack.of(this).region });
    new cdk.CfnOutput(this, "UserPoolId", { value: userPool.userPoolId });
    new cdk.CfnOutput(this, "UserPoolClientId", { value: userPoolClient.userPoolClientId });
    new cdk.CfnOutput(this, "AudioBucketName", { value: audioBucket.bucketName });
    new cdk.CfnOutput(this, "DatabaseEndpoint", { value: database.instanceEndpoint.hostname });
    new cdk.CfnOutput(this, "DatabaseSecretName", { value: database.secret!.secretName });
    new cdk.CfnOutput(this, "OpenAiSecretName", { value: openAiSecret.secretName });
    new cdk.CfnOutput(this, "AnalysisQueueUrl", { value: analysisQueue.queueUrl });
    new cdk.CfnOutput(this, "AudioQueueUrl", { value: audioQueue.queueUrl });
    new cdk.CfnOutput(this, "NotificationQueueUrl", { value: notificationQueue.queueUrl });
    new cdk.CfnOutput(this, "DeadLetterQueueUrl", { value: deadLetterQueue.queueUrl });
  }
}
