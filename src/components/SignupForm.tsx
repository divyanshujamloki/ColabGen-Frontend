"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { signup } from "@/lib/api/client";
import { ApiError } from "@/lib/api/types";
import { saveSession } from "@/lib/auth/session";
import { Alert, Button, Card, Input } from "@/components/ui";

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function passwordStrength(pwd: string): { score: number; label: string; color: string } {
  if (pwd.length === 0) return { score: 0, label: "", color: "bg-border" };
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  if (score <= 1) return { score: 1, label: "Weak", color: "bg-danger" };
  if (score <= 3) return { score: 2, label: "Fair", color: "bg-warning" };
  return { score: 3, label: "Strong", color: "bg-success" };
}

export function SignupForm() {
  const router = useRouter();
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

  const pwdError = useMemo(() => {
    if (!touched.password) return undefined;
    if (password.length > 0 && password.length < 6) return "Password must be at least 6 characters";
    return undefined;
  }, [password, touched.password]);

  const strength = passwordStrength(password);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!isValidEmail(email) || password.length < 6) return;

    setError(null);
    setLoading(true);
    try {
      const session = await signup(email, password);
      saveSession(session);
      router.push("/generate");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof Error ? err.message : "Sign up failed",
      );
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

        <div className="space-y-2">
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            error={pwdError}
            showPasswordToggle
            placeholder="At least 6 characters"
          />
          {password.length > 0 ? (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i <= strength.score ? strength.color : "bg-border"
                    }`}
                  />
                ))}
              </div>
              <p className="text-[11px] text-muted">
                Strength: <span className="text-foreground">{strength.label}</span>
              </p>
            </div>
          ) : null}
        </div>

        {error ? <Alert variant="error">{error}</Alert> : null}

        <Button type="submit" fullWidth loading={loading} disabled={!email || password.length < 6}>
          {loading ? "Creating account…" : "Create account"}
        </Button>

        <p className="text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </Card>
  );
}
