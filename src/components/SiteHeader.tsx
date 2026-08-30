"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearSession, getStoredEmail, getAccessToken } from "@/lib/auth/session";
import { logout } from "@/lib/api/client";
import { useEffect, useState } from "react";
import { useCredits } from "@/lib/credits/CreditsContext";

export function SiteHeader() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const { credits, refreshCredits } = useCredits();

  useEffect(() => {
    setEmail(getStoredEmail());
  }, []);

  async function signOut() {
    const token = getAccessToken();
    if (token) {
      await logout(token);
    }
    clearSession();
    setEmail(null);
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="relative z-10 border-b border-border/80 backdrop-blur-md bg-[#0b0f14]/80 sticky top-0">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 transition hover:opacity-80 shrink-0">
          <img src="/logo.png" alt="GPUBridge" className="h-8 w-auto" />
          <span className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-foreground hidden sm:inline-block">
            GPUBridge
          </span>
        </Link>
        
        <nav className="flex items-center gap-1 overflow-x-auto whitespace-nowrap text-sm sm:gap-2.5 hide-scrollbar">
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

              {/* Real-Time Credits Pill */}
              <button
                type="button"
                onClick={() => refreshCredits()}
                title="Click to refresh credits balance"
                className="flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 font-mono text-xs font-semibold text-teal-300 shadow-sm transition hover:bg-teal-500/20 active:scale-95 shrink-0"
              >
                <span className="text-teal-400">⚡</span>
                <span>{credits !== null ? `${credits} Credits` : "..."}</span>
              </button>

              <span className="hidden max-w-[8rem] truncate font-mono text-xs text-muted lg:inline shrink-0">
                {email}
              </span>

              <button
                type="button"
                onClick={signOut}
                className="rounded-md px-2 py-1.5 text-xs text-muted transition hover:bg-surface-soft hover:text-foreground shrink-0"
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
