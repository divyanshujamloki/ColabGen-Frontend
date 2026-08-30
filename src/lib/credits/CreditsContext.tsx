"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getMe } from "@/lib/api/client";
import { getAccessToken, getStoredEmail } from "@/lib/auth/session";

export interface CreditToast {
  id: string;
  type: "deduction" | "warning" | "info" | "success";
  title: string;
  message: string;
  cost?: number;
  remaining?: number;
  timestamp: number;
}

interface CreditsContextValue {
  credits: number | null;
  loading: boolean;
  refreshCredits: () => Promise<number | null>;
  deductCredits: (cost: number, operationName: string) => void;
  setCreditsManually: (val: number) => void;
}

const CreditsContext = createContext<CreditsContextValue | null>(null);

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [toasts, setToasts] = useState<CreditToast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<CreditToast, "id" | "timestamp">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: CreditToast = {
      ...toast,
      id,
      timestamp: Date.now(),
    };
    setToasts((prev) => [newToast, ...prev].slice(0, 5));

    // Auto dismiss after 4.5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  const refreshCredits = useCallback(async (): Promise<number | null> => {
    const token = getAccessToken();
    if (!token) {
      setCredits(null);
      return null;
    }
    try {
      setLoading(true);
      const res = await getMe(token);
      if (res.credits !== undefined) {
        setCredits(res.credits);
        return res.credits;
      }
      return null;
    } catch (err) {
      console.error("Failed to fetch credits:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (getStoredEmail()) {
      refreshCredits();
    }
  }, [refreshCredits]);

  const deductCredits = useCallback(
    (cost: number, operationName: string) => {
      setCredits((prev) => {
        const current = prev ?? 100;
        const remaining = Math.max(0, current - cost);

        // Add deduction toast
        addToast({
          type: "deduction",
          title: `-${cost} Credits Deducted`,
          message: `${operationName} (Remaining: ${remaining} credits)`,
          cost,
          remaining,
        });

        // Low balance warning
        if (remaining <= 15 && remaining > 0) {
          setTimeout(() => {
            addToast({
              type: "warning",
              title: "⚠️ Low Credits Warning",
              message: `Only ${remaining} credits remaining. Email divyanshujamloki05@gmail for free top-up.`,
            });
          }, 600);
        } else if (remaining === 0) {
          setTimeout(() => {
            addToast({
              type: "warning",
              title: "🚫 Credits Exhausted",
              message: "You have 0 credits. Please contact admin at divyanshujamloki05@gmail.",
            });
          }, 600);
        }

        return remaining;
      });
    },
    [addToast]
  );

  return (
    <CreditsContext.Provider
      value={{
        credits,
        loading,
        refreshCredits,
        deductCredits,
        setCreditsManually: setCredits,
      }}
    >
      {children}

      {/* Floating Real-Time Credit Deduction Toasts */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-2xl backdrop-blur-lg transition-all animate-fade-up ${
              t.type === "deduction"
                ? "border-teal-500/30 bg-[#0e1620]/95 text-foreground shadow-teal-500/10"
                : t.type === "warning"
                ? "border-amber-500/40 bg-[#1c140a]/95 text-amber-200 shadow-amber-500/10"
                : "border-border/80 bg-surface/95 text-foreground"
            }`}
          >
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400 font-bold text-xs">
              {t.type === "deduction" ? "⚡" : "⚠️"}
            </div>
            <div className="flex-1 space-y-0.5 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold tracking-wide text-foreground">
                  {t.title}
                </p>
                <button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  className="text-muted/60 hover:text-foreground text-xs leading-none p-1"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-muted leading-relaxed truncate">
                {t.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  const ctx = useContext(CreditsContext);
  if (!ctx) {
    throw new Error("useCredits must be used within a CreditsProvider");
  }
  return ctx;
}
