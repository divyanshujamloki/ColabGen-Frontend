"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredEmail, getAccessToken, clearSession } from "@/lib/auth/session";
import { changePassword, logout } from "@/lib/api/client";
import { getSupportEmail } from "@/lib/config";
import { useCredits } from "@/lib/credits/CreditsContext";
import { Alert, Badge, Button, Card, CardHeader, Input, SegmentedControl } from "@/components/ui";
import { useTheme } from "@/lib/theme/ThemeProvider";

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

const COST_ITEMS = [
  { label: "Image", cost: 5, desc: "Text to image" },
  { label: "Video", cost: 10, desc: "Text to video" },
  { label: "Chat", cost: 5, desc: "AI assistant" },
  { label: "Voice", cost: 5, desc: "XTTS synthesis" },
  { label: "Edit", cost: 5, desc: "InstructPix2Pix" },
  { label: "Map", cost: 5, desc: "Travel animation" },
];

export function ProfileView() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { credits, loading: creditsLoading, refreshCredits } = useCredits();
  const [email, setEmail] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  useEffect(() => {
    const stored = getStoredEmail();
    if (!stored) {
      router.push("/login");
    } else {
      setEmail(stored);
      refreshCredits();
    }
  }, [router, refreshCredits]);

  const strength = passwordStrength(newPassword);

  const requirements = useMemo(() => [
    { met: newPassword.length >= 6, label: "At least 6 characters" },
    { met: newPassword === confirmPassword && confirmPassword.length > 0, label: "Passwords match" },
  ], [newPassword, confirmPassword]);

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(null);

    if (newPassword.length < 6) {
      setPwdError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError("New password and confirm password do not match.");
      return;
    }

    setPwdLoading(true);
    try {
      const token = getAccessToken();
      if (!token) throw new Error("Please log in again.");

      await changePassword(token, newPassword);
      setPwdSuccess("Password updated successfully. Use your new password on next sign in.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPwdError(err instanceof Error ? err.message : "Failed to update password. Please try again.");
    } finally {
      setPwdLoading(false);
    }
  }

  async function handleSignOut() {
    const token = getAccessToken();
    if (token) await logout(token);
    clearSession();
    router.push("/login");
    router.refresh();
  }

  function resetPasswordForm() {
    setNewPassword("");
    setConfirmPassword("");
    setPwdError(null);
    setPwdSuccess(null);
  }

  const supportEmail = getSupportEmail();

  function copyAdminEmail() {
    if (!supportEmail) return;
    navigator.clipboard.writeText(supportEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  }

  const initialLetter = email ? email[0].toUpperCase() : "U";
  const balance = credits ?? 100;
  const percentage = Math.min(100, Math.max(0, (balance / 100) * 100));

  return (
    <div className="space-y-8 animate-fade-up max-w-5xl mx-auto pb-12">
      {/* Header */}
      <Card padding="lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-accent to-emerald-400 font-[family-name:var(--font-display)] text-2xl font-bold text-slate-950 shadow-lg shadow-accent/20">
              {initialLetter}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-[family-name:var(--font-display)] text-xl sm:text-2xl font-bold tracking-tight truncate">
                  {email}
                </h1>
                <Badge variant="success">Active</Badge>
              </div>
              <p className="text-xs text-muted font-mono mt-0.5">
                GPUBridge Cloud · In-house Compute
              </p>
            </div>
          </div>
          <Button variant="danger" size="sm" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Credits */}
        <div className="lg:col-span-7 space-y-6">
          <Card padding="md">
            <CardHeader
              title="Credits balance"
              description="Available compute credits for all tools"
              action={
                <Button variant="secondary" size="sm" onClick={() => refreshCredits()} disabled={creditsLoading}>
                  {creditsLoading ? "Syncing…" : "Refresh"}
                </Button>
              }
            />

            <div className="rounded-xl border border-border/60 bg-[var(--bg-sunken)] p-5 mb-6">
              <p className="text-caption mb-2">Available credits</p>
              <div className="flex items-baseline gap-2">
                <span className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl font-extrabold text-accent tracking-tight">
                  {credits !== null ? credits : "…"}
                </span>
                <span className="text-sm text-muted">/ 100 initial</span>
              </div>
              <div className="mt-4 h-2 w-full rounded-full bg-surface-soft overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    percentage > 30 ? "bg-gradient-to-r from-accent to-emerald-400" : percentage > 15 ? "bg-warning" : "bg-danger"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted">{percentage.toFixed(0)}% remaining</p>
            </div>

            <h3 className="text-caption mb-3">Cost per task</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              {COST_ITEMS.map((item) => (
                <div key={item.label} className="rounded-lg border border-border/50 bg-[var(--bg-sunken)]/60 p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-foreground">{item.label}</span>
                    <span className="font-mono font-bold text-accent">{item.cost} Cr</span>
                  </div>
                  <p className="text-[11px] text-muted">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-accent/25 bg-accent/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-accent">Need more credits?</p>
                <p className="text-xs text-muted mt-0.5">
                  {supportEmail
                    ? "Contact admin for a free credit top-up."
                    : "Contact the site admin for a free credit top-up."}
                </p>
              </div>
              {supportEmail ? (
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`mailto:${supportEmail}?subject=GPUBridge%20Credits%20Top-up%20Request`}
                    className="btn-primary !text-xs !py-2 !px-3.5"
                  >
                    Email admin
                  </a>
                  <button type="button" onClick={copyAdminEmail} className="btn-secondary !text-xs !py-2 !px-3">
                    {copiedEmail ? "Copied!" : "Copy email"}
                  </button>
                </div>
              ) : null}
            </div>
          </Card>
        </div>

        {/* Password */}
        <div className="lg:col-span-5">
          <Card padding="md">
            <CardHeader
              title="Change password"
              description="Update your account password securely"
            />

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <Input
                label="New password"
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                showPasswordToggle
                placeholder="At least 6 characters"
              />

              {newPassword.length > 0 ? (
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.score ? strength.color : "bg-border"}`} />
                    ))}
                  </div>
                  <p className="text-[11px] text-muted">Strength: {strength.label}</p>
                </div>
              ) : null}

              <Input
                label="Confirm new password"
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                showPasswordToggle
                placeholder="Repeat new password"
              />

              <ul className="space-y-1">
                {requirements.map((r) => (
                  <li key={r.label} className={`flex items-center gap-2 text-xs ${r.met ? "text-success" : "text-muted"}`}>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {r.met ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      ) : (
                        <circle cx="12" cy="12" r="9" strokeWidth={2} />
                      )}
                    </svg>
                    {r.label}
                  </li>
                ))}
              </ul>

              {pwdError ? <Alert variant="error">{pwdError}</Alert> : null}
              {pwdSuccess ? <Alert variant="success">{pwdSuccess}</Alert> : null}

              <div className="flex gap-2">
                <Button
                  type="submit"
                  fullWidth
                  loading={pwdLoading}
                  disabled={pwdLoading || !newPassword || !confirmPassword}
                >
                  {pwdLoading ? "Updating…" : "Update password"}
                </Button>
                {(newPassword || confirmPassword) ? (
                  <Button type="button" variant="secondary" onClick={resetPasswordForm}>
                    Cancel
                  </Button>
                ) : null}
              </div>
            </form>
          </Card>

          <Card padding="md" className="mt-6">
            <CardHeader
              title="Appearance"
              description="Choose your preferred color theme"
            />
            <SegmentedControl
              options={[
                { value: "dark" as const, label: "Dark" },
                { value: "light" as const, label: "Light" },
              ]}
              value={theme}
              onChange={setTheme}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
