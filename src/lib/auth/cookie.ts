const COOKIE = "gpubridge_token";

export function hasSessionCookie(cookieHeader: string | null): boolean {
  if (!cookieHeader) return false;
  return cookieHeader
    .split(";")
    .some((c) => c.trim().startsWith(`${COOKIE}=1`));
}

export function sessionCookieName(): string {
  return COOKIE;
}
