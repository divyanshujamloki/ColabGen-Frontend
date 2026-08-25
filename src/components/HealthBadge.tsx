"use client";

import { useEffect, useState } from "react";
import { getHealth } from "@/lib/api/client";
import type { HealthResponse } from "@/lib/api/types";

export function HealthBadge() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getHealth();
        if (!cancelled) {
          setHealth(data);
          setError(false);
        }
      } catch {
        if (!cancelled) {
          setHealth(null);
          setError(true);
        }
      }
    }
    load();
    const id = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const gpuOk = Boolean(health?.gpu?.ok);
  const label = error
    ? "API offline"
    : !health
      ? "Checking…"
      : gpuOk
        ? "GPU ready"
        : "GPU offline";

  const tone = error
    ? "bg-danger/15 text-danger"
    : gpuOk
      ? "bg-accent/15 text-accent"
      : "bg-muted/20 text-muted";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-md px-2.5 py-1 font-mono text-xs ${tone}`}
      title="Live status from GET /health"
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          error ? "bg-danger" : gpuOk ? "bg-accent" : "bg-muted"
        }`}
      />
      {label}
    </span>
  );
}
