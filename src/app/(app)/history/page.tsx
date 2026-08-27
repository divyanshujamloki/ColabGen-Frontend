"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listJobs } from "@/lib/api/client";
import type { JobRow } from "@/lib/api/types";
import { getAccessToken } from "@/lib/auth/session";

export default function HistoryPage() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const token = getAccessToken();
      if (!token) {
        setError("Not signed in");
        setLoading(false);
        return;
      }
      try {
        const rows = await listJobs(token);
        if (!cancelled) setJobs(rows);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load jobs");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="animate-fade-up">
      <h1 className="mb-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
        History
      </h1>
      <p className="mb-8 max-w-xl text-muted">
        Your recent generation jobs.
      </p>

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : jobs.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface/50 px-6 py-12 text-center">
          <p className="text-muted">No jobs yet.</p>
          <Link
            href="/generate"
            className="mt-4 inline-block text-accent hover:underline"
          >
            Generate something
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {jobs.map((job) => (
            <li
              key={job.id}
              className="flex flex-col gap-3 rounded-lg border border-border bg-surface/50 p-4 sm:flex-row sm:items-start"
            >
              <div className="h-24 w-full shrink-0 overflow-hidden rounded-md bg-black/40 sm:w-36">
                {job.status === "succeeded" && job.result_url ? (
                  job.type === "image" || job.type === "img2img" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={job.result_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : job.type === "tts" ? (
                    <div className="flex h-full flex-col items-center justify-center gap-1 px-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-accent">
                        Audio
                      </span>
                      <audio
                        src={job.result_url}
                        controls
                        className="h-8 w-full max-w-full"
                      />
                    </div>
                  ) : (
                    <video
                      src={job.result_url}
                      muted
                      className="h-full w-full object-cover"
                    />
                  )
                ) : (
                  <div className="flex h-full items-center justify-center font-mono text-xs text-muted">
                    {job.status}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="rounded bg-surface-soft px-2 py-0.5 font-mono text-xs capitalize text-accent">
                    {job.type}
                  </span>
                  <StatusPill status={job.status} />
                  <time
                    dateTime={job.created_at}
                    className="font-mono text-xs text-muted"
                  >
                    {new Date(job.created_at).toLocaleString()}
                  </time>
                </div>
                <p className="line-clamp-2 text-sm text-foreground">
                  {job.prompt}
                </p>
                {job.error ? (
                  <p className="mt-1 text-xs text-danger">{job.error}</p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-3 font-mono text-xs text-muted">
                  {job.inference_ms != null ? (
                    <span>{job.inference_ms} ms</span>
                  ) : null}
                  {job.seed ? <span>seed {job.seed}</span> : null}
                  {job.result_url ? (
                    <a
                      href={job.result_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent hover:underline"
                    >
                      Open result
                    </a>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: JobRow["status"] }) {
  const tone =
    status === "succeeded"
      ? "text-accent"
      : status === "failed"
        ? "text-danger"
        : "text-muted";
  return (
    <span className={`font-mono text-xs capitalize ${tone}`}>{status}</span>
  );
}
