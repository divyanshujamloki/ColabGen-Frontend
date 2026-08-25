import { NextResponse, type NextRequest } from "next/server";
import { hasSessionCookie } from "@/lib/auth/cookie";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const authed = hasSessionCookie(request.headers.get("cookie"));
  const isProtected =
    path.startsWith("/generate") || path.startsWith("/history");
  const isAuthPage = path === "/login" || path === "/signup";

  if (isProtected && !authed) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && authed) {
    const url = request.nextUrl.clone();
    url.pathname = "/generate";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
