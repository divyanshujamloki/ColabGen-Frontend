"use client";

import { FormEvent, useRef, useState } from "react";
import { generateImage, generateVideo } from "@/lib/api/client";
import { ApiError, type GenerateResult } from "@/lib/api/types";
import { createClient } from "@/lib/supabase/client";

type Mode = "image" | "video";

const inputClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground outline-none ring-accent focus:ring-2 disabled:opacity-60";

export function GenerateForm() {
  const [mode, setMode] = useState<Mode>("image");
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [steps, setSteps] = useState(4);
  const [width, setWidth] = useState(512);
  const [height, setHeight] = useState(512);
  const [guidance, setGuidance] = useState(0);
  const [fps, setFps] = useState(8);
  const [seed, setSeed] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    setStatusText("Submitting job…");

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Not signed in");
      }

      const seedNum = seed.trim() === "" ? null : Number(seed);
      if (seed.trim() !== "" && !Number.isFinite(seedNum)) {
        throw new Error("Seed must be an integer");
      }

      const pollOpts = {
        signal: ac.signal,
        onUpdate: (job: { id: string; status: string }) => {
          setStatusText(
            job.status === "running"
              ? `Job ${job.id.slice(0, 8)}… running (polling)`
              : `Job ${job.status}`,
          );
        },
      };

      const data =
        mode === "image"
          ? await generateImage(
              session.access_token,
              {
                prompt,
                negative_prompt: negativePrompt || null,
                steps,
                width,
                height,
                guidance_scale: guidance,
                seed: seedNum,
              },
              pollOpts,
            )
          : await generateVideo(
              session.access_token,
              {
                prompt,
                negative_prompt: negativePrompt || null,
                steps,
                fps,
                seed: seedNum,
              },
              pollOpts,
            );

      setResult(data);
      setStatusText(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.jobId ? `${err.message} (job ${err.jobId})` : err.message,
        );
      } else if (err instanceof Error) {
        if (err.message !== "Polling cancelled") {
          setError(err.message);
        }
      } else {
        setError("Generation failed");
      }
      setStatusText(null);
    } finally {
      setLoading(false);
    }
  }

  function switchMode(next: Mode) {
    if (loading) return;
    setMode(next);
    setSteps(next === "image" ? 4 : 10);
    setError(null);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="flex gap-2 rounded-md border border-border bg-surface p-1">
          {(["image", "video"] as const).map((m) => (
            <button
              key={m}
              type="button"
              disabled={loading}
              onClick={() => switchMode(m)}
              className={`flex-1 rounded px-3 py-2 text-sm font-medium capitalize transition ${
                mode === m
                  ? "bg-accent text-[#0c1218]"
                  : "text-muted hover:text-foreground"
              } disabled:opacity-50`}
            >
              {m}
            </button>
          ))}
        </div>

        <div>
          <label htmlFor="prompt" className="mb-1.5 block text-sm text-muted">
            Prompt
          </label>
          <textarea
            id="prompt"
            required
            maxLength={2000}
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
            placeholder={
              mode === "image"
                ? "a red bicycle on a rainy Tokyo street, cinematic, 35mm"
                : "a red bicycle riding through rainy Tokyo streets, cinematic"
            }
            className={`${inputClass} resize-y py-2.5`}
          />
        </div>

        <div>
          <label htmlFor="negative" className="mb-1.5 block text-sm text-muted">
            Negative prompt
          </label>
          <input
            id="negative"
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            disabled={loading}
            className={`${inputClass} py-2.5`}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field
            label={`Steps (${mode === "image" ? "1–8" : "10–40"})`}
            id="steps"
          >
            <input
              id="steps"
              type="number"
              min={mode === "image" ? 1 : 10}
              max={mode === "image" ? 8 : 40}
              value={steps}
              onChange={(e) => setSteps(Number(e.target.value))}
              disabled={loading}
              className={inputClass}
            />
          </Field>
          {mode === "image" ? (
            <>
              <Field label="Width" id="width">
                <input
                  id="width"
                  type="number"
                  min={256}
                  max={1024}
                  step={64}
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  disabled={loading}
                  className={inputClass}
                />
              </Field>
              <Field label="Height" id="height">
                <input
                  id="height"
                  type="number"
                  min={256}
                  max={1024}
                  step={64}
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  disabled={loading}
                  className={inputClass}
                />
              </Field>
              <Field label="Guidance" id="guidance">
                <input
                  id="guidance"
                  type="number"
                  min={0}
                  max={15}
                  step={0.5}
                  value={guidance}
                  onChange={(e) => setGuidance(Number(e.target.value))}
                  disabled={loading}
                  className={inputClass}
                />
              </Field>
            </>
          ) : (
            <Field label="FPS (4–12)" id="fps">
              <input
                id="fps"
                type="number"
                min={4}
                max={12}
                value={fps}
                onChange={(e) => setFps(Number(e.target.value))}
                disabled={loading}
                className={inputClass}
              />
            </Field>
          )}
          <Field label="Seed (optional)" id="seed">
            <input
              id="seed"
              type="text"
              inputMode="numeric"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              disabled={loading}
              placeholder="random"
              className={inputClass}
            />
          </Field>
        </div>

        {error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className={`w-full rounded-md bg-accent py-3 font-[family-name:var(--font-display)] text-base font-semibold text-[#0c1218] transition hover:bg-accent-dim disabled:opacity-60 ${
            loading ? "animate-pulse-glow" : ""
          }`}
        >
          {loading
            ? `Generating ${mode}…`
            : `Generate ${mode}`}
        </button>
        <p className="text-xs text-muted">
          Production API returns 202 and we poll{" "}
          <code className="text-accent">/jobs/:id</code> until done. Do not run
          image and video at the same time on one GPU.
        </p>
      </form>

      <div className="flex min-h-[280px] flex-col rounded-lg border border-border bg-surface/60 p-4">
        <h2 className="mb-3 font-[family-name:var(--font-display)] text-lg font-semibold">
          Result
        </h2>
        {loading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted">
            <span
              className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin-ring"
              aria-hidden
            />
            <p className="text-sm text-center">
              {statusText ?? "Waiting for Colab + Cloudinary…"}
            </p>
          </div>
        ) : result ? (
          <div className="flex flex-1 flex-col gap-3 animate-fade-up">
            {result.type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={result.url}
                alt={prompt}
                className="max-h-[420px] w-full rounded-md object-contain bg-black/40"
              />
            ) : (
              <video
                src={result.url}
                controls
                autoPlay
                loop
                className="max-h-[420px] w-full rounded-md bg-black/40"
              />
            )}
            <dl className="grid grid-cols-2 gap-2 font-mono text-xs text-muted">
              <div>
                <dt>Job</dt>
                <dd className="truncate text-foreground">{result.id}</dd>
              </div>
              <div>
                <dt>Seed</dt>
                <dd className="text-foreground">{result.seed ?? "—"}</dd>
              </div>
              <div>
                <dt>Inference</dt>
                <dd className="text-foreground">
                  {result.inferenceMs != null
                    ? `${result.inferenceMs} ms`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt>Download</dt>
                <dd>
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent hover:underline"
                  >
                    Open URL
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted">
            Output appears here after a successful run.
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}
