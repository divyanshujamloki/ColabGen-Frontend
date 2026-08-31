"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { login } from "@/lib/api/client";
import { ApiError } from "@/lib/api/types";
import { saveSession } from "@/lib/auth/session";
import { Alert, Button, Card, Input } from "@/components/ui";

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/generate";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });

  const emailError = useMemo(() => {
    if (!touched.email) return undefined;
    if (!email.trim()) return "Email is required";
    if (!isValidEmail(email)) return "Enter a valid email address";
    return undefined;
  }, [email, touched.email]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!isValidEmail(email)) return;

    setError(null);
    setLoading(true);
    try {
      const session = await login(email, password);
      saveSession(session);
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card padding="lg" className="animate-fade-up">
      <form onSubmit={onSubmit} className="space-y-5">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          error={emailError}
          placeholder="you@example.com"
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
          showPasswordToggle
          placeholder="••••••••"
        />

        {error ? <Alert variant="error">{error}</Alert> : null}

        <Button type="submit" fullWidth loading={loading} disabled={!email || !password}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>

        <p className="text-center text-sm text-muted">
          No account?{" "}
          <Link href="/signup" className="font-medium text-accent hover:underline">
            Create one
          </Link>
        </p>
      </form>
    </Card>
  );
}
