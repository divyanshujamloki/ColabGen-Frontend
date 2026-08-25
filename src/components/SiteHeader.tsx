"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearSession, getStoredEmail } from "@/lib/auth/session";
import { useEffect, useState } from "react";

export function SiteHeader() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    setEmail(getStoredEmail());
  }, []);

  function signOut() {
    clearSession();
    setEmail(null);
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="relative z-10 border-b border-border/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-foreground transition hover:text-accent"
        >
          GPUBridge
        </Link>
        <nav className="flex items-center gap-1 text-sm sm:gap-3">
          {email ? (
            <>
              <Link
                href="/generate"
                className="rounded-md px-2.5 py-1.5 text-muted transition hover:bg-surface-soft hover:text-foreground"
              >
                Generate
              </Link>
              <Link
                href="/history"
                className="rounded-md px-2.5 py-1.5 text-muted transition hover:bg-surface-soft hover:text-foreground"
              >
                History
              </Link>
              <span className="hidden max-w-[10rem] truncate font-mono text-xs text-muted sm:inline">
                {email}
              </span>
              <button
                type="button"
                onClick={signOut}
                className="rounded-md px-2.5 py-1.5 text-muted transition hover:bg-surface-soft hover:text-foreground"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md px-2.5 py-1.5 text-muted transition hover:text-foreground"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-accent px-3 py-1.5 font-medium text-[#0c1218] transition hover:bg-accent-dim"
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
