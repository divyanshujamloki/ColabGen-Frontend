import { sessionCookieName } from "./cookie";

const TOKEN_KEY = "gpubridge_access_token";
const REFRESH_KEY = "gpubridge_refresh_token";
const EMAIL_KEY = "gpubridge_email";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredEmail(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(EMAIL_KEY);
}

export function saveSession(session: {
  access_token: string;
  refresh_token: string;
  user: { email: string | null };
}): void {
  localStorage.setItem(TOKEN_KEY, session.access_token);
  localStorage.setItem(REFRESH_KEY, session.refresh_token);
  if (session.user.email) {
    localStorage.setItem(EMAIL_KEY, session.user.email);
  } else {
    localStorage.removeItem(EMAIL_KEY);
  }
  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `${sessionCookieName()}=1; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(EMAIL_KEY);
  document.cookie = `${sessionCookieName()}=; path=/; max-age=0; SameSite=Lax`;
}
