"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredEmail, getAccessToken, clearSession } from "@/lib/auth/session";
import { changePassword, logout } from "@/lib/api/client";
import { useCredits } from "@/lib/credits/CreditsContext";

export function ProfileView() {
  const router = useRouter();
  const { credits, loading: creditsLoading, refreshCredits } = useCredits();
  const [email, setEmail] = useState<string | null>(null);

  // Password reset state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);

  // Copy state
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
      setPwdSuccess("Password updated successfully! Use your new password on next sign in.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPwdError(err.message || "Failed to update password. Please try again.");
    } finally {
      setPwdLoading(false);
    }
  }

  async function handleSignOut() {
    const token = getAccessToken();
    if (token) {
      await logout(token);
    }
    clearSession();
    router.push("/login");
    router.refresh();
  }

  function copyAdminEmail() {
    navigator.clipboard.writeText("divyanshujamloki05@gmail.com");
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  }

  const initialLetter = email ? email[0].toUpperCase() : "U";
  const balance = credits ?? 100;
  const percentage = Math.min(100, Math.max(0, (balance / 100) * 100));

  return (
    <div className="space-y-8 animate-fade-up max-w-5xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-border/80 bg-[#121923] p-6 sm:p-8 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 font-[family-name:var(--font-display)] text-2xl font-bold text-slate-950 shadow-lg shadow-teal-500/20">
              {initialLetter}
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-[family-name:var(--font-display)] text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                  {email}
                </h1>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                  Active
                </span>
              </div>
              <p className="text-xs text-muted font-mono">
                GPUBridge Cloud • In-house Compute Tier
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="self-start sm:self-auto rounded-xl border border-danger/40 bg-danger/10 px-4 py-2.5 text-xs font-semibold text-danger transition hover:bg-danger/20 active:scale-95"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Credits & Usage */}
        <div className="lg:col-span-7 space-y-6">
          {/* Credit Balance Card */}
          <div className="rounded-2xl border border-border/80 bg-[#121923] p-6 shadow-xl backdrop-blur-md space-y-6">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl text-teal-400">⚡</span>
                <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-foreground">
                  Credits Balance
                </h2>
              </div>
              <button
                type="button"
                onClick={() => refreshCredits()}
                disabled={creditsLoading}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground transition active:scale-95 disabled:opacity-50"
              >
                <span className={creditsLoading ? "animate-spin" : ""}>🔄</span>
                {creditsLoading ? "Syncing…" : "Refresh"}
              </button>
            </div>

            {/* Big Stat Display */}
            <div className="rounded-xl border border-border/60 bg-[#0c1218] p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted mb-1">
                    Available Compute Credits
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl font-extrabold text-teal-400 tracking-tight">
                      {credits !== null ? credits : "..."}
                    </span>
                    <span className="text-sm text-muted font-medium">/ 100 initial</span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end gap-2 text-xs text-muted">
                  <span className="rounded-full bg-teal-500/10 border border-teal-500/30 px-3 py-1 text-teal-300 font-semibold font-mono">
                    {percentage.toFixed(0)}% Remaining
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 h-2.5 w-full rounded-full bg-surface-soft overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    percentage > 30
                      ? "bg-gradient-to-r from-teal-500 to-emerald-400"
                      : percentage > 15
                      ? "bg-amber-400"
                      : "bg-danger"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            {/* Rate Card Breakdown */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
                Cost Breakdown per Task
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="rounded-lg border border-border/50 bg-[#0c1218]/60 p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-foreground">🖼️ Image</span>
                    <span className="font-mono font-bold text-teal-400">5 Cr</span>
                  </div>
                  <p className="text-[11px] text-muted">Text to image generation</p>
                </div>

                <div className="rounded-lg border border-border/50 bg-[#0c1218]/60 p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-foreground">🎬 Video</span>
                    <span className="font-mono font-bold text-teal-400">10 Cr</span>
                  </div>
                  <p className="text-[11px] text-muted">Text to video rendering</p>
                </div>

                <div className="rounded-lg border border-border/50 bg-[#0c1218]/60 p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-foreground">💬 Chat</span>
                    <span className="font-mono font-bold text-teal-400">5 Cr</span>
                  </div>
                  <p className="text-[11px] text-muted">AI assistant prompt</p>
                </div>

                <div className="rounded-lg border border-border/50 bg-[#0c1218]/60 p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-foreground">🎙️ Voice</span>
                    <span className="font-mono font-bold text-teal-400">5 Cr</span>
                  </div>
                  <p className="text-[11px] text-muted">XTTS-v2 voice synthesis</p>
                </div>

                <div className="rounded-lg border border-border/50 bg-[#0c1218]/60 p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-foreground">🎨 Edit</span>
                    <span className="font-mono font-bold text-teal-400">5 Cr</span>
                  </div>
                  <p className="text-[11px] text-muted">InstructPix2Pix editing</p>
                </div>

                <div className="rounded-lg border border-border/50 bg-[#0c1218]/60 p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-foreground">🗺️ Map</span>
                    <span className="font-mono font-bold text-teal-400">5 Cr</span>
                  </div>
                  <p className="text-[11px] text-muted">Travel animation video</p>
                </div>
              </div>
            </div>

            {/* Need More Credits Box */}
            <div className="rounded-xl border border-teal-500/30 bg-teal-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-teal-300">
                  Need more free credits?
                </p>
                <p className="text-xs text-muted">
                  Contact admin for immediate free credit top-up on your account.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href="mailto:divyanshujamloki05@gmail.com?subject=GPUBridge%20Credits%20Top-up%20Request&body=Hi%2C%20please%20add%20more%20credits%20to%20my%20account%3A%20"
                  className="rounded-lg bg-teal-400 px-3.5 py-2 text-xs font-bold text-slate-950 hover:brightness-105 transition active:scale-95"
                >
                  Email Admin
                </a>
                <button
                  type="button"
                  onClick={copyAdminEmail}
                  className="rounded-lg border border-border bg-[#0c1218] px-3 py-2 text-xs text-muted hover:text-foreground transition active:scale-95"
                >
                  {copiedEmail ? "Copied! ✓" : "Copy Email"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Password Reset & Security */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-border/80 bg-[#121923] p-6 shadow-xl backdrop-blur-md space-y-5">
            <div className="border-b border-border/60 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl text-foreground">🔒</span>
                <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-foreground">
                  Change Password
                </h2>
              </div>
              <p className="text-xs text-muted mt-1">
                Update your account password securely.
              </p>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-muted mb-1.5">
                  New Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-lg border border-border/80 bg-[#0c1218] px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/60 outline-none transition focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-muted mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full rounded-lg border border-border/80 bg-[#0c1218] px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/60 outline-none transition focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-muted cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    className="rounded border-border bg-[#0c1218] text-teal-400 focus:ring-0"
                  />
                  <span>Show password</span>
                </label>
              </div>

              {pwdError ? (
                <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2.5 text-xs text-danger flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{pwdError}</span>
                </div>
              ) : null}

              {pwdSuccess ? (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-300 flex items-center gap-2">
                  <span>✓</span>
                  <span>{pwdSuccess}</span>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={pwdLoading || !newPassword || !confirmPassword}
                className="w-full rounded-xl bg-gradient-to-r from-teal-400 via-teal-300 to-emerald-400 py-3 font-[family-name:var(--font-display)] text-sm font-bold text-slate-950 shadow-lg shadow-teal-500/10 transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
              >
                {pwdLoading ? "Updating Password…" : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
