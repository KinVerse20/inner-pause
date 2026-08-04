import { unauthenticated } from "../shared/errors.js";
import { createRemoteJWKSet, jwtVerify } from "jose";
import type { BackendConfig } from "../config/env.js";

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName?: string;
  groups: string[];
}

export interface TokenVerifier {
  verify(accessToken: string): Promise<AuthenticatedUser>;
}

export class CognitoJwtVerifier implements TokenVerifier {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;
  private readonly issuer: string;

  constructor(private readonly config: Pick<BackendConfig, "region" | "cognitoUserPoolId" | "cognitoClientId">) {
    if (!config.region || !config.cognitoUserPoolId || !config.cognitoClientId) throw unauthenticated();
    this.issuer = `https://cognito-idp.${config.region}.amazonaws.com/${config.cognitoUserPoolId}`;
    this.jwks = createRemoteJWKSet(new URL(`${this.issuer}/.well-known/jwks.json`));
  }

  async verify(accessToken: string): Promise<AuthenticatedUser> {
    try {
      const { payload } = await jwtVerify(accessToken, this.jwks, {
        issuer: this.issuer,
      });
      if (payload.token_use !== "access" && payload.token_use !== "id") throw unauthenticated();
      const clientId = payload.client_id ?? payload.aud;
      if (clientId !== this.config.cognitoClientId) throw unauthenticated();
      const subject = String(payload.sub ?? "");
      if (!subject) throw unauthenticated();
      const email = typeof payload.email === "string" ? payload.email : `${subject}@cognito.local`;
      const fullName = typeof payload.name === "string" ? payload.name : undefined;
      const rawGroups = payload["cognito:groups"];
      const groups = Array.isArray(rawGroups) ? rawGroups.filter((group): group is string => typeof group === "string") : [];
      return { id: subject, email, fullName, groups };
    } catch {
      throw unauthenticated();
    }
  }
}

export class TestTokenVerifier implements TokenVerifier {
  async verify(accessToken: string): Promise<AuthenticatedUser> {
    if (!accessToken || accessToken === "expired" || accessToken === "invalid") throw unauthenticated();

    if (accessToken.startsWith("test-user-a")) {
      return { id: "11111111-1111-4111-8111-111111111111", email: "user-a@example.com", fullName: "User A", groups: [] };
    }
    if (accessToken.startsWith("test-user-b")) {
      return { id: "22222222-2222-4222-8222-222222222222", email: "user-b@example.com", fullName: "User B", groups: [] };
    }
    if (accessToken.startsWith("test-admin")) {
      return { id: "99999999-9999-4999-8999-999999999999", email: "admin@example.com", fullName: "Test Admin", groups: ["InnerPauseAdmins"] };
    }

    return { id: `cognito-${accessToken.slice(0, 16)}`, email: "test-user@example.com", groups: [] };
  }
}

export const CognitoTokenVerifier = CognitoJwtVerifier;

export async function authenticate(headers: Record<string, string | undefined>, verifier: TokenVerifier) {
  const header = headers.authorization ?? headers.Authorization;
  const match = /^Bearer\s+(.+)$/i.exec(header ?? "");
  if (!match) throw unauthenticated();
  return verifier.verify(match[1]);
}
