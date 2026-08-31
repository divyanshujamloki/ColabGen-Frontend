"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listJobs } from "@/lib/api/client";
import type { JobRow } from "@/lib/api/types";
import { getAccessToken } from "@/lib/auth/session";
import {
  Alert,
  Badge,
  EmptyState,
  HistorySkeleton,
  PageHeader,
  SegmentedControl,
  StatusBadge,
} from "@/components/ui";

type ViewMode = "list" | "grid";
type SortMode = "newest" | "oldest" | "type";
type FilterType = "all" | "image" | "video" | "tts" | "img2img" | "map";

export default function HistoryPage() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("list");
  const [sort, setSort] = useState<SortMode>("newest");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [search, setSearch] = useState("");

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
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    let result = [...jobs];

    if (filterType !== "all") {
      result = result.filter((j) => j.type === filterType);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((j) => j.prompt?.toLowerCase().includes(q));
    }

    result.sort((a, b) => {
      if (sort === "type") return a.type.localeCompare(b.type);
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return sort === "newest" ? tb - ta : ta - tb;
    });

    return result;
  }, [jobs, filterType, search, sort]);

  return (
    <div>
      <PageHeader
        title="History"
        description="Your recent generation jobs across all tools."
      />

      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between animate-fade-up">
        <input
          type="search"
          placeholder="Search by prompt…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-base max-w-sm"
        />
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className="input-base !w-auto text-sm"
          >
            <option value="all">All types</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="tts">Voice</option>
            <option value="img2img">Edit</option>
            <option value="map">Map</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="input-base !w-auto text-sm"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="type">By type</option>
          </select>
          <SegmentedControl
            options={[
              { value: "list" as ViewMode, label: "List" },
              { value: "grid" as ViewMode, label: "Grid" },
            ]}
            value={view}
            onChange={setView}
            className="!w-auto"
          />
        </div>
      </div>

      {loading ? (
        <HistorySkeleton />
      ) : error ? (
        <Alert variant="error">{error}</Alert>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={jobs.length === 0 ? "No jobs yet" : "No matching jobs"}
          description={
            jobs.length === 0
              ? "Generate something to see it appear here."
              : "Try adjusting your search or filters."
          }
          action={jobs.length === 0 ? { label: "Start generating", href: "/generate" } : undefined}
        />
      ) : view === "list" ? (
        <ul className="space-y-3 animate-fade-up">
          {filtered.map((job) => (
            <JobListItem key={job.id} job={job} />
          ))}
        </ul>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-up">
          {filtered.map((job) => (
            <JobGridItem key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}

function JobThumbnail({ job }: { job: JobRow }) {
  if (job.status === "succeeded" && job.result_url) {
    if (job.type === "image" || job.type === "img2img") {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={job.result_url} alt="" className="h-full w-full object-cover" />
      );
    }
    if (job.type === "tts") {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-1 px-2 bg-surface-soft">
          <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-6-6h12" />
          </svg>
          <span className="text-[10px] uppercase tracking-wider text-muted">Audio</span>
        </div>
      );
    }
    return (
      <video src={job.result_url} muted className="h-full w-full object-cover" />
    );
  }
  return (
    <div className="flex h-full items-center justify-center font-mono text-xs text-muted capitalize">
      {job.status}
    </div>
  );
}

function JobListItem({ job }: { job: JobRow }) {
  return (
    <li className="card card-interactive flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
      <div className="h-24 w-full shrink-0 overflow-hidden rounded-lg bg-preview sm:w-36">
        <JobThumbnail job={job} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <Badge variant="accent">{job.type}</Badge>
          <StatusBadge status={job.status} />
          <time dateTime={job.created_at} className="font-mono text-xs text-muted">
            {new Date(job.created_at).toLocaleString()}
          </time>
        </div>
        <p className="line-clamp-2 text-sm text-foreground">{job.prompt}</p>
        {job.error ? <p className="mt-1 text-xs text-danger">{job.error}</p> : null}
        <div className="mt-2 flex flex-wrap gap-3 font-mono text-xs text-muted">
          {job.inference_ms != null ? <span>{job.inference_ms} ms</span> : null}
          {job.seed ? <span>seed {job.seed}</span> : null}
          {job.result_url ? (
            <a href={job.result_url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
              Open result
            </a>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function JobGridItem({ job }: { job: JobRow }) {
  return (
    <div className="card card-interactive overflow-hidden group">
      <div className="aspect-video overflow-hidden bg-preview">
        <JobThumbnail job={job} />
      </div>
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="accent">{job.type}</Badge>
          <StatusBadge status={job.status} />
        </div>
        <p className="line-clamp-2 text-sm text-foreground">{job.prompt}</p>
        <div className="mt-2 flex items-center justify-between text-xs text-muted">
          <time dateTime={job.created_at}>{new Date(job.created_at).toLocaleDateString()}</time>
          {job.result_url ? (
            <a href={job.result_url} target="_blank" rel="noreferrer" className="text-accent hover:underline opacity-0 group-hover:opacity-100 transition">
              Open
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
