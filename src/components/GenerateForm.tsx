"use client";

import { FormEvent, useRef, useState } from "react";
import { generateImage, generateVideo } from "@/lib/api/client";
import { ApiError, type GenerateResult } from "@/lib/api/types";
import { getAccessToken } from "@/lib/auth/session";
import { useCredits } from "@/lib/credits/CreditsContext";

type Mode = "image" | "video";

const inputClass =
  "w-full rounded-lg border border-border/80 bg-[#0c1218] px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/60 outline-none transition focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-60";

export function GenerateForm() {
  const { deductCredits } = useCredits();
  const [mode, setMode] = useState<Mode>("image");
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [steps, setSteps] = useState(25);
  const [width, setWidth] = useState(512);
  const [height, setHeight] = useState(512);
  const [guidance, setGuidance] = useState(7.5);
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
      const accessToken = getAccessToken();
      if (!accessToken) {
        throw new Error("Not signed in. Please sign in to generate.");
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
              ? `Job ${job.id.slice(0, 8)}… generating on GPU`
              : `Job status: ${job.status}`,
          );
        },
      };

      const cost = mode === "image" ? 5 : 10;
      const opName = mode === "image" ? "Image Generation" : "Video Generation";

      const data =
        mode === "image"
          ? await generateImage(
              accessToken,
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
              accessToken,
              {
                prompt,
                negative_prompt: negativePrompt || null,
                steps,
                fps,
                guidance_scale: guidance,
                seed: seedNum,
              },
              pollOpts,
            );

      deductCredits(cost, opName);
      setResult(data);
      setStatusText(null);
    } catch (err) {
      if (err instanceof ApiError) {
        let message = err.message;
        if (err.status === 422 && err.details) {
          const details = err.details as any;
          if (Array.isArray(details?.detail)) {
            const fields = details.detail
              .map((d: any) => d.loc?.[1] || d.msg)
              .filter(Boolean);
            if (fields.length > 0) {
              message = `Invalid parameters: ${fields.join(", ")}. Please check your input values.`;
            }
          }
        }
        setError(err.jobId ? `${message} (job ${err.jobId})` : message);
      } else if (err instanceof Error) {
        if (err.message !== "Polling cancelled") {
          setError(err.message);
        }
      } else {
        setError("Generation failed. Please try again.");
      }
      setStatusText(null);
    } finally {
      setLoading(false);
    }
  }

  function switchMode(next: Mode) {
    if (loading) return;
    setMode(next);
    setSteps(25);
    setGuidance(next === "image" ? 7.5 : 9.0);
    setError(null);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12 items-start">
      {/* Left Column: Form Card */}
      <div className="lg:col-span-6 xl:col-span-6 rounded-2xl border border-border/80 bg-[#121923] p-5 sm:p-6 shadow-xl backdrop-blur-md">
        <form onSubmit={onSubmit} className="space-y-5">
          {/* Mode Switch Tabs */}
          <div className="flex rounded-lg border border-border/70 bg-[#0c1218] p-1">
            <button
              type="button"
              disabled={loading}
              onClick={() => switchMode("image")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all ${
                mode === "image"
                  ? "bg-accent text-[#081016] shadow-sm font-semibold"
                  : "text-muted hover:text-foreground"
              } disabled:opacity-50`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Image
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => switchMode("video")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all ${
                mode === "video"
                  ? "bg-accent text-[#081016] shadow-sm font-semibold"
                  : "text-muted hover:text-foreground"
              } disabled:opacity-50`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Video
            </button>
          </div>

          {/* Prompt */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="prompt" className="text-xs font-medium uppercase tracking-wider text-muted">
                Prompt <span className="text-accent">*</span>
              </label>
              <span className="text-[11px] text-muted/60">{prompt.length}/2000</span>
            </div>
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
                  ? "e.g. A hyperrealistic futuristic sports car cruising neon cyberpunk Tokyo rain..."
                  : "e.g. Cinematic drone shot flowing over snowy mountain peak at sunrise..."
              }
              className={`${inputClass} resize-y leading-relaxed`}
            />
          </div>

          {/* Negative Prompt */}
          <div>
            <label htmlFor="negative" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">
              Negative Prompt (Optional)
            </label>
            <input
              id="negative"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              disabled={loading}
              placeholder="e.g. blur, low quality, distorted, watermark"
              className={inputClass}
            />
          </div>

          {/* Parameters Grid */}
          <div className="rounded-xl border border-border/50 bg-[#0c1218]/60 p-3.5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Field
                label={`Steps (${mode === "image" ? "15–50" : "10–40"})`}
                id="steps"
              >
                <input
                  id="steps"
                  type="number"
                  min={mode === "image" ? 15 : 10}
                  max={mode === "image" ? 50 : 40}
                  value={steps}
                  onChange={(e) => setSteps(Number(e.target.value))}
                  disabled={loading}
                  className={inputClass}
                />
              </Field>

              {mode === "image" ? (
                <>
                  <Field label="Width (px)" id="width">
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
                  <Field label="Height (px)" id="height">
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
                  <Field label="Guidance Scale" id="guidance">
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
                <>
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
                  <Field label="Guidance Scale" id="guidance">
                    <input
                      id="guidance"
                      type="number"
                      min={1}
                      max={20}
                      step={0.5}
                      value={guidance}
                      onChange={(e) => setGuidance(Number(e.target.value))}
                      disabled={loading}
                      className={inputClass}
                    />
                  </Field>
                </>
              )}

              <Field label="Seed (optional)" id="seed">
                <input
                  id="seed"
                  type="text"
                  inputMode="numeric"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  disabled={loading}
                  placeholder="Random"
                  className={inputClass}
                />
              </Field>
            </div>
          </div>

          {error ? (
            <div className="rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger flex items-start gap-2" role="alert">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          ) : null}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className={`w-full rounded-xl bg-gradient-to-r from-teal-400 via-teal-300 to-emerald-400 py-3.5 font-[family-name:var(--font-display)] text-sm sm:text-base font-bold text-[#08121a] shadow-lg shadow-teal-500/10 transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none ${
              loading ? "animate-pulse" : ""
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-slate-900 border-t-transparent animate-spin" />
                Generating {mode}…
              </span>
            ) : (
              `Generate ${mode === "image" ? "Image" : "Video"}`
            )}
          </button>
          <p className="text-center text-xs text-muted/70">
            Generation typically takes 10–30s on dedicated GPU Bridge worker.
          </p>
        </form>
      </div>

      {/* Right Column: Result Card */}
      <div className="lg:col-span-6 xl:col-span-6 flex flex-col rounded-2xl border border-border/80 bg-[#121923] p-5 sm:p-6 shadow-xl backdrop-blur-md min-h-[420px] lg:min-h-[540px]">
        <div className="flex items-center justify-between border-b border-border/60 pb-3.5 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="font-[family-name:var(--font-display)] text-base sm:text-lg font-semibold tracking-tight text-foreground">
              Result
            </h2>
            {result && (
              <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent">
                Completed
              </span>
            )}
          </div>
          {result && (
            <a
              href={result.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-accent hover:underline flex items-center gap-1 font-medium"
            >
              Open original
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>

        {loading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-muted py-12">
            <div className="relative flex items-center justify-center">
              <span className="h-12 w-12 rounded-full border-2 border-accent/20 border-t-accent animate-spin-ring" />
              <span className="absolute h-6 w-6 rounded-full bg-accent/20 animate-ping" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-foreground">
                {statusText ?? "Processing job on GPU…"}
              </p>
              <p className="text-xs text-muted">
                Please wait while the model synthesizes the frame.
              </p>
            </div>
          </div>
        ) : result ? (
          <div className="flex flex-1 flex-col justify-between gap-4 animate-fade-up">
            <div className="flex items-center justify-center rounded-xl overflow-hidden bg-black/50 border border-border/40 min-h-[260px] max-h-[460px]">
              {result.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={result.url}
                  alt={prompt}
                  className="max-h-[440px] w-full object-contain"
                />
              ) : (
                <video
                  src={result.url}
                  controls
                  autoPlay
                  loop
                  className="max-h-[440px] w-full"
                />
              )}
            </div>

            <div className="rounded-xl border border-border/60 bg-[#0c1218]/80 p-3">
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <dt className="text-muted/70">Job ID</dt>
                  <dd className="font-mono truncate text-foreground font-medium">{result.id.slice(0, 10)}…</dd>
                </div>
                <div>
                  <dt className="text-muted/70">Seed</dt>
                  <dd className="font-mono text-foreground font-medium">{result.seed ?? "Auto"}</dd>
                </div>
                <div>
                  <dt className="text-muted/70">Inference</dt>
                  <dd className="font-mono text-foreground font-medium">
                    {result.inferenceMs != null ? `${(result.inferenceMs / 1000).toFixed(2)}s` : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted/70">Format</dt>
                  <dd className="font-mono uppercase text-foreground font-medium">{result.type}</dd>
                </div>
              </dl>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center p-8 text-muted border border-dashed border-border/40 rounded-xl bg-[#0c1218]/30">
            <div className="mb-3 rounded-full bg-surface-soft p-3 text-muted/60">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground/80 mb-1">No output yet</p>
            <p className="text-xs text-muted max-w-[240px]">
              Fill out the prompt on the left and click Generate to see the GPU result.
            </p>
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
      <label htmlFor={id} className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}
