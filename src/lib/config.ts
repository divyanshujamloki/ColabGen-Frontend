/** Optional public contact for credit top-ups. Set in host env — never commit a personal address. */
export function getSupportEmail(): string {
  return (process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "").trim();
}
