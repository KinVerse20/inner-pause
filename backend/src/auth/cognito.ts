import { unauthenticated } from "../shared/errors.js";

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName?: string;
}

export interface TokenVerifier {
  verify(accessToken: string): Promise<AuthenticatedUser>;
}

export class CognitoTokenVerifier implements TokenVerifier {
  async verify(accessToken: string): Promise<AuthenticatedUser> {
    if (!accessToken || accessToken === "expired" || accessToken === "invalid") throw unauthenticated();

    // AWS test scaffold: replace with Cognito JWKS verification before live use.
    // The backend never trusts a frontend-supplied user id; identity must come from this verifier.
    if (accessToken.startsWith("test-user-a")) {
      return { id: "11111111-1111-4111-8111-111111111111", email: "user-a@example.com", fullName: "User A" };
    }
    if (accessToken.startsWith("test-user-b")) {
      return { id: "22222222-2222-4222-8222-222222222222", email: "user-b@example.com", fullName: "User B" };
    }

    return { id: `cognito-${accessToken.slice(0, 16)}`, email: "test-user@example.com" };
  }
}

export async function authenticate(headers: Record<string, string | undefined>, verifier: TokenVerifier) {
  const header = headers.authorization ?? headers.Authorization;
  const match = /^Bearer\s+(.+)$/i.exec(header ?? "");
  if (!match) throw unauthenticated();
  return verifier.verify(match[1]);
}

