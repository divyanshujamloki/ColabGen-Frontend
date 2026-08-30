import Link from "next/link";
import { SignupForm } from "@/components/SignupForm";

export default function SignupPage() {
  return (
    <main className="relative flex flex-1 flex-col">
      <div className="pointer-events-none absolute inset-0 bg-grid" aria-hidden />
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
        <div className="mb-8 flex justify-center">
          <Link href="/" className="inline-block">
            <img src="/logo.png" alt="GPUBridge" className="h-12 w-auto" />
          </Link>
        </div>
        <h1 className="mb-2 text-center font-[family-name:var(--font-display)] text-3xl font-semibold">
          Create account
        </h1>
        <p className="mb-8 text-center text-sm text-muted">
          Get started with GPUBridge.
        </p>
        <SignupForm />
      </div>
    </main>
  );
}
