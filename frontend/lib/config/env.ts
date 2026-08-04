export interface FrontendConfig {
  apiBaseUrl: string;
  appUrl: string;
  awsRegion?: string;
  cognitoUserPoolId?: string;
  cognitoClientId?: string;
}

export function readFrontendConfig(env = process.env): FrontendConfig {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is required for the separated frontend.");
  }
  return {
    apiBaseUrl,
    appUrl: env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    awsRegion: env.NEXT_PUBLIC_AWS_REGION,
    cognitoUserPoolId: env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID,
    cognitoClientId: env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID,
  };
}

