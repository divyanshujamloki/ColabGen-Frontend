"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession, getStoredEmail, getAccessToken } from "@/lib/auth/session";
import { logout } from "@/lib/api/client";
import { useEffect, useRef, useState } from "react";
import { useCredits } from "@/lib/credits/CreditsContext";
import { ThemeToggle } from "@/components/ThemeToggle";

const NAV_ITEMS = [
  { href: "/generate", label: "Generate" },
  { href: "/chat", label: "Chat" },
  { href: "/voice", label: "Voice" },
  { href: "/image-editor", label: "Edit" },
  { href: "/map-editor", label: "Map" },
  { href: "/history", label: "History" },
];

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { credits } = useCredits();

  useEffect(() => {
    setEmail(getStoredEmail());
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function signOut() {
    const token = getAccessToken();
    if (token) await logout(token);
    clearSession();
    setEmail(null);
    router.push("/login");
    router.refresh();
  }

  const initial = email ? email[0].toUpperCase() : "U";

  function NavLink({ href, label, mobile = false }: { href: string; label: string; mobile?: boolean }) {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return (
      <Link
        href={href}
        className={`relative rounded-lg font-medium transition-colors ${
          mobile ? "block px-4 py-3 text-base" : "px-2.5 py-1.5 text-sm"
        } ${
          active
            ? "bg-accent/10 text-accent"
            : "text-muted hover:bg-surface-soft hover:text-foreground"
        }`}
      >
        {label}
        {active && !mobile ? (
          <span className="absolute bottom-0 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-accent" />
        ) : null}
      </Link>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-[var(--bg)]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 transition hover:opacity-85">
          <img src="/logo.png" alt="GPUBridge" className="h-8 w-auto" />
          <span className="hidden font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight sm:inline">
            GPUBridge
          </span>
        </Link>

        {email ? (
          <>
            {/* Desktop nav */}
            <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <ThemeToggle />

              {/* Credits pill */}
              <Link
                href="/profile"
                title="View credits"
                className="hidden items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 font-mono text-xs font-semibold text-accent transition hover:bg-accent/20 sm:flex"
              >
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                {credits !== null ? `${credits} Cr` : "…"}
              </Link>

              {/* User menu */}
              <div className="relative hidden lg:block" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-xl border border-border/80 bg-surface-soft px-2.5 py-1.5 text-sm transition hover:border-accent/30"
                  aria-expanded={menuOpen}
                  aria-haspopup="true"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-accent to-emerald-400 text-[11px] font-bold text-slate-950">
                    {initial}
                  </span>
                  <span className="max-w-[120px] truncate text-xs text-muted hidden xl:inline">
                    {email}
                  </span>
                  <svg className={`h-3.5 w-3.5 text-muted transition-transform ${menuOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {menuOpen ? (
                  <div className="absolute right-0 top-full mt-2 w-52 animate-slide-down overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
                    <div className="border-b border-border/60 px-4 py-3">
                      <p className="truncate text-xs font-medium text-foreground">{email}</p>
                      <p className="text-[11px] text-muted">GPUBridge account</p>
                    </div>
                    <div className="p-1.5">
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition hover:bg-surface-soft"
                      >
                        Profile &amp; Security
                      </Link>
                      <button
                        type="button"
                        onClick={signOut}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger transition hover:bg-danger/10"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Mobile hamburger */}
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/80 text-muted transition hover:bg-surface-soft hover:text-foreground lg:hidden"
                onClick={() => setMobileOpen((o) => !o)}
                aria-expanded={mobileOpen}
                aria-label="Toggle menu"
              >
                {mobileOpen ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </>
        ) : (
          <nav className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className="btn-ghost text-sm">
              Sign in
            </Link>
            <Link href="/signup" className="btn-primary text-sm !py-2 !px-4">
              Get started
            </Link>
          </nav>
        )}
      </div>

      {/* Mobile drawer */}
      {email && mobileOpen ? (
        <div className="border-t border-border/60 bg-surface lg:hidden animate-slide-down">
          <nav className="mx-auto max-w-6xl px-2 py-3" aria-label="Mobile">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.href} {...item} mobile />
            ))}
            <div className="mt-2 border-t border-border/60 pt-2">
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-xs text-muted">Theme</span>
                <ThemeToggle showLabel />
              </div>
              <Link
                href="/profile"
                className="flex items-center gap-3 px-4 py-3 text-sm text-foreground"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-accent to-emerald-400 text-xs font-bold text-slate-950">
                  {initial}
                </span>
                Profile
                <span className="ml-auto font-mono text-xs text-accent">
                  {credits !== null ? `${credits} Cr` : "…"}
                </span>
              </Link>
              <button
                type="button"
                onClick={signOut}
                className="flex w-full items-center px-4 py-3 text-sm text-danger"
              >
                Sign out
              </button>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
