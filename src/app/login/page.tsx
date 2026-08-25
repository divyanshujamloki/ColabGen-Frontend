import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="relative flex flex-1 flex-col">
      <div className="pointer-events-none absolute inset-0 bg-grid" aria-hidden />
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
        <Link
          href="/"
          className="mb-8 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-foreground"
        >
          GPUBridge
        </Link>
        <h1 className="mb-2 font-[family-name:var(--font-display)] text-3xl font-semibold">
          Sign in
        </h1>
        <p className="mb-8 text-sm text-muted">
          Sign in via the ColabGen API (
          <code className="text-accent">POST /auth/login</code>).
        </p>
        <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
