export interface FrontendConfig {
  apiBaseUrl: string;
  appUrl: string;
  awsRegion?: string;
  cognitoUserPoolId?: string;
  cognitoClientId?: string;
}

interface FrontendEnvironment {
  NEXT_PUBLIC_API_BASE_URL?: string;
  NEXT_PUBLIC_APP_URL?: string;
  NEXT_PUBLIC_AWS_REGION?: string;
  NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID?: string;
  NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID?: string;
}

export function readFrontendConfig(
  env: FrontendEnvironment = {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_AWS_REGION: process.env.NEXT_PUBLIC_AWS_REGION,
    NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID:
      process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID,
    NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID:
      process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID,
  },
): FrontendConfig {
  const apiBaseUrl = env.NEXT_PUBLIC_API_BASE_URL;

  if (!apiBaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL is required for the separated frontend.",
    );
  }

  return {
    apiBaseUrl,
    appUrl: env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    awsRegion: env.NEXT_PUBLIC_AWS_REGION,
    cognitoUserPoolId: env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID,
    cognitoClientId: env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID,
  };
}
}

