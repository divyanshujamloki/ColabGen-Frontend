"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearSession, getStoredEmail, getAccessToken } from "@/lib/auth/session";
import { getMe, logout } from "@/lib/api/client";
import { useEffect, useState } from "react";

export function SiteHeader() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    setEmail(getStoredEmail());
    const token = getAccessToken();
    if (token) {
      getMe(token)
        .then((res) => {
          if (res.credits !== undefined) {
            setCredits(res.credits);
          }
        })
        .catch((err) => console.error("Failed to fetch credits", err));
    }
  }, []);

  async function signOut() {
    const token = getAccessToken();
    if (token) {
      await logout(token);
    }
    clearSession();
    setEmail(null);
    setCredits(null);
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="relative z-10 border-b border-border/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 transition hover:opacity-80">
          <img src="/logo.png" alt="GPUBridge" className="h-8 w-auto" />
          <span className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-foreground hidden sm:inline-block">
            GPUBridge
          </span>
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto whitespace-nowrap text-sm sm:gap-3 hide-scrollbar">
          {email ? (
            <>
              <Link
                href="/generate"
                className="rounded-md px-2.5 py-1.5 text-muted transition hover:bg-surface-soft hover:text-foreground shrink-0"
              >
                Generate
              </Link>
              <Link
                href="/chat"
                className="rounded-md px-2.5 py-1.5 text-muted transition hover:bg-surface-soft hover:text-foreground shrink-0"
              >
                Chat
              </Link>
              <Link
                href="/voice"
                className="rounded-md px-2.5 py-1.5 text-muted transition hover:bg-surface-soft hover:text-foreground shrink-0"
              >
                Voice
              </Link>
              <Link
                href="/image-editor"
                className="rounded-md px-2.5 py-1.5 text-muted transition hover:bg-surface-soft hover:text-foreground shrink-0"
              >
                Edit
              </Link>
              <Link
                href="/map-editor"
                className="rounded-md px-2.5 py-1.5 text-muted transition hover:bg-surface-soft hover:text-foreground shrink-0"
              >
                Map
              </Link>
              <Link
                href="/history"
                className="rounded-md px-2.5 py-1.5 text-muted transition hover:bg-surface-soft hover:text-foreground shrink-0"
              >
                History
              </Link>
              <span className="hidden max-w-[10rem] truncate font-mono text-xs text-muted sm:inline shrink-0">
                {email}
                {credits !== null && (
                  <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-accent">
                    {credits} Credits
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={signOut}
                className="rounded-md px-2.5 py-1.5 text-muted transition hover:bg-surface-soft hover:text-foreground shrink-0"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md px-2.5 py-1.5 text-muted transition hover:text-foreground shrink-0"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-accent px-3 py-1.5 font-medium text-[#0c1218] transition hover:bg-accent-dim shrink-0"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
