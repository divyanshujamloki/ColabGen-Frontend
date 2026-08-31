import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Spinner } from "@/components/ui";

export default function LoginPage() {
  return (
    <main className="relative flex flex-1 flex-col">
      <div className="pointer-events-none absolute inset-0 bg-grid" aria-hidden />
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16 sm:py-20">
        <div className="mb-8 flex flex-col items-center gap-3 animate-fade-up">
          <Link href="/" className="transition hover:opacity-85">
            <img src="/logo.png" alt="GPUBridge" className="h-11 w-auto" />
          </Link>
          <div className="text-center">
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-muted">
              Sign in to your GPUBridge account
            </p>
          </div>
        </div>
        <Suspense fallback={<Spinner label="Loading…" className="py-8" />}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
