"use client";

import {
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  InitiateAuthCommand,
  ResendConfirmationCodeCommand,
  SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";

import { readFrontendConfig } from "@/lib/config/env";

export interface CognitoSession {
  accessToken: string;
  idToken?: string;
  refreshToken?: string;
  expiresAt: number;
  email: string;
  fullName?: string;
}

export class FrontendCognitoAuthService {
  private readonly client: CognitoIdentityProviderClient;
  private readonly clientId: string;

  constructor() {
    const config = readFrontendConfig();

    if (
      !config.awsRegion ||
      !config.cognitoClientId ||
      !config.cognitoUserPoolId
    ) {
      throw new Error("Cognito public configuration is incomplete.");
    }

    this.clientId = config.cognitoClientId;
    this.client = new CognitoIdentityProviderClient({
      region: config.awsRegion,
    });
  }

  async signUp(input: {
    email: string;
    password: string;
    fullName?: string;
  }) {
    await this.client.send(
      new SignUpCommand({
        ClientId: this.clientId,
        Username: input.email,
        Password: input.password,
        UserAttributes: [
          {
            Name: "email",
            Value: input.email,
          },
          ...(input.fullName
            ? [
                {
                  Name: "name",
                  Value: input.fullName,
                },
              ]
            : []),
        ],
      }),
    );
  }

  async confirmSignUp(input: { email: string; code: string }) {
    await this.client.send(
      new ConfirmSignUpCommand({
        ClientId: this.clientId,
        Username: input.email,
        ConfirmationCode: input.code,
      }),
    );
  }

  async resendVerification(email: string) {
    await this.client.send(
      new ResendConfirmationCodeCommand({
        ClientId: this.clientId,
        Username: email,
      }),
    );
  }

  async signIn(input: {
    email: string;
    password: string;
    fullName?: string;
  }): Promise<CognitoSession> {
    const response = await this.client.send(
      new InitiateAuthCommand({
        ClientId: this.clientId,
        AuthFlow: "USER_PASSWORD_AUTH",
        AuthParameters: {
          USERNAME: input.email,
          PASSWORD: input.password,
        },
      }),
    );

    const result = response.AuthenticationResult;

    if (!result?.AccessToken || !result.IdToken) {
      if (response.ChallengeName === "NEW_PASSWORD_REQUIRED") {
        throw new Error(
          "This account uses a temporary password. Delete this test user from Cognito and create the account again through The InnerPause app.",
        );
      }

      if (response.ChallengeName) {
        throw new Error(
          `Cognito requires another authentication step: ${response.ChallengeName}`,
        );
      }

      throw new Error("Cognito did not return a complete session.");
    }

    return {
      accessToken: result.AccessToken,
      idToken: result.IdToken,
      refreshToken: result.RefreshToken,
      expiresAt: Date.now() + (result.ExpiresIn ?? 3600) * 1000,
      email: input.email,
      fullName: input.fullName,
    };
  }

  async refresh(
    refreshToken: string,
  ): Promise<Pick<CognitoSession, "accessToken" | "idToken" | "expiresAt">> {
    const response = await this.client.send(
      new InitiateAuthCommand({
        ClientId: this.clientId,
        AuthFlow: "REFRESH_TOKEN_AUTH",
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
        },
      }),
    );

    const result = response.AuthenticationResult;

    if (!result?.AccessToken || !result.IdToken) {
      throw new Error("Could not refresh session.");
    }

    return {
      accessToken: result.AccessToken,
      idToken: result.IdToken,
      expiresAt: Date.now() + (result.ExpiresIn ?? 3600) * 1000,
    };
  }

  async forgotPassword(email: string) {
    await this.client.send(
      new ForgotPasswordCommand({
        ClientId: this.clientId,
        Username: email,
      }),
    );
  }

  async confirmForgotPassword(input: {
    email: string;
    code: string;
    password: string;
  }) {
    await this.client.send(
      new ConfirmForgotPasswordCommand({
        ClientId: this.clientId,
        Username: input.email,
        ConfirmationCode: input.code,
        Password: input.password,
      }),
    );
  }
}
