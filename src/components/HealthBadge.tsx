"use client";

import { useEffect, useState } from "react";
import { getHealth } from "@/lib/api/client";
import type { HealthResponse } from "@/lib/api/types";
import { Badge } from "@/components/ui";

export function HealthBadge() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState(false);
  const [waking, setWaking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!cancelled) setWaking(true);
      try {
        const data = await getHealth();
        if (!cancelled) {
          setHealth(data);
          setError(false);
          setWaking(false);
        }
      } catch {
        if (!cancelled) {
          setHealth(null);
          setError(true);
          setWaking(false);
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
  const label = waking
    ? "Waking API…"
    : error
      ? "API offline"
      : !health
        ? "Checking…"
        : gpuOk
          ? "GPU ready"
          : "GPU offline";

  const variant = waking ? "warning" : error ? "danger" : gpuOk ? "success" : "default";

  return (
    <Badge variant={variant} pulse={waking || (!error && !gpuOk && !waking)} className="font-mono">
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          waking ? "bg-warning" : error ? "bg-danger" : gpuOk ? "bg-success" : "bg-muted"
        }`}
      />
      {label}
    </Badge>
  );
}
