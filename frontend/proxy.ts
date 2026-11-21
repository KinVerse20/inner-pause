import { NextResponse, type NextRequest } from "next/server";

const publicRoutes = [
  "/auth",
  "/auth/reset-password",
  "/about",
  "/offline",
  "/manifest.webmanifest",
  "/icon.png",
  "/apple-icon.png",
];

function isPublicPath(pathname: string) {
  return (
    publicRoutes.some((path) => pathname === path || pathname.startsWith(`${path}/`)) ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/branding/") ||
    pathname.startsWith("/audio/")
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Cognito tokens for the standalone AWS frontend are stored client-side.
  // Route redirects are handled by AuthProvider in the browser, while backend
  // endpoints validate Cognito JWTs for real access control.
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
