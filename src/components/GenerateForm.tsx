"use client";

import { FormEvent, useRef, useState } from "react";
import { generateImage, generateVideo } from "@/lib/api/client";
import { ApiError, type GenerateResult } from "@/lib/api/types";
import { getAccessToken } from "@/lib/auth/session";
import { useCredits } from "@/lib/credits/CreditsContext";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  LoadingOverlay,
  SegmentedControl,
  Textarea,
} from "@/components/ui";

type Mode = "image" | "video";

const PRESETS = {
  image: { quick: { steps: 15, guidance: 7.5 }, quality: { steps: 35, guidance: 8.5 } },
  video: { quick: { steps: 15, guidance: 9 }, quality: { steps: 30, guidance: 10 } },
};

const inputClass = "input-base disabled:opacity-60";

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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const creditCost = mode === "image" ? 5 : 10;

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
      if (!accessToken) throw new Error("Not signed in. Please sign in to generate.");

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

      deductCredits(creditCost, opName);
      setResult(data);
      setStatusText(null);
    } catch (err) {
      if (err instanceof ApiError) {
        let message = err.message;
        if (err.status === 422 && err.details) {
          const details = err.details as { detail?: { loc?: string[]; msg?: string }[] };
          if (Array.isArray(details?.detail)) {
            const fields = details.detail
              .map((d) => d.loc?.[1] || d.msg)
              .filter(Boolean);
            if (fields.length > 0) {
              message = `Invalid parameters: ${fields.join(", ")}. Please check your input values.`;
            }
          }
        }
        setError(err.jobId ? `${message} (job ${err.jobId})` : message);
      } else if (err instanceof Error) {
        if (err.message !== "Polling cancelled") setError(err.message);
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

  function applyPreset(kind: "quick" | "quality") {
    const p = PRESETS[mode][kind];
    setSteps(p.steps);
    setGuidance(p.guidance);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 items-start">
      <Card padding="md" className="animate-fade-up">
        <form onSubmit={onSubmit} className="space-y-5">
          <SegmentedControl
            options={[
              {
                value: "image" as Mode,
                label: "Image",
                icon: (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ),
              },
              {
                value: "video" as Mode,
                label: "Video",
                icon: (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                ),
              },
            ]}
            value={mode}
            onChange={switchMode}
            disabled={loading}
          />

          <Textarea
            label="Prompt *"
            required
            maxLength={2000}
            showCount
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
            placeholder={
              mode === "image"
                ? "A hyperrealistic futuristic sports car cruising neon cyberpunk Tokyo rain…"
                : "Cinematic drone shot flowing over snowy mountain peak at sunrise…"
            }
          />

          <div>
            <label htmlFor="negative" className="mb-1.5 block text-sm font-medium text-muted">
              Negative prompt
            </label>
            <input
              id="negative"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              disabled={loading}
              placeholder="blur, low quality, distorted, watermark"
              className={inputClass}
            />
          </div>

          {/* Presets */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => applyPreset("quick")}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition hover:border-accent/40 hover:text-accent disabled:opacity-50"
            >
              Quick preset
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => applyPreset("quality")}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition hover:border-accent/40 hover:text-accent disabled:opacity-50"
            >
              Quality preset
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => setShowAdvanced((s) => !s)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition hover:border-accent/40 hover:text-accent disabled:opacity-50"
            >
              {showAdvanced ? "Hide" : "Show"} advanced
            </button>
          </div>

          {showAdvanced ? (
            <div className="rounded-xl border border-border/50 bg-[var(--bg-sunken)]/60 p-3.5 space-y-3 animate-fade-in">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Field label={`Steps (${mode === "image" ? "15–50" : "10–40"})`} id="steps">
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
                    <Field label="Width" id="width">
                      <input id="width" type="number" min={256} max={1024} step={64} value={width} onChange={(e) => setWidth(Number(e.target.value))} disabled={loading} className={inputClass} />
                    </Field>
                    <Field label="Height" id="height">
                      <input id="height" type="number" min={256} max={1024} step={64} value={height} onChange={(e) => setHeight(Number(e.target.value))} disabled={loading} className={inputClass} />
                    </Field>
                  </>
                ) : (
                  <Field label="FPS (4–12)" id="fps">
                    <input id="fps" type="number" min={4} max={12} value={fps} onChange={(e) => setFps(Number(e.target.value))} disabled={loading} className={inputClass} />
                  </Field>
                )}

                <Field label="Guidance" id="guidance">
                  <input id="guidance" type="number" min={0} max={20} step={0.5} value={guidance} onChange={(e) => setGuidance(Number(e.target.value))} disabled={loading} className={inputClass} />
                </Field>

                <Field label="Seed" id="seed">
                  <input id="seed" type="text" inputMode="numeric" value={seed} onChange={(e) => setSeed(e.target.value)} disabled={loading} placeholder="Random" className={inputClass} />
                </Field>
              </div>
            </div>
          ) : null}

          {error ? <Alert variant="error">{error}</Alert> : null}

          <div className="flex items-center justify-between text-xs text-muted">
            <span>Cost: <strong className="text-accent">{creditCost} credits</strong></span>
            <span>~10–30s on GPU</span>
          </div>

          <Button type="submit" fullWidth loading={loading} disabled={!prompt.trim()}>
            {loading ? `Generating ${mode}…` : `Generate ${mode === "image" ? "Image" : "Video"}`}
          </Button>
        </form>
      </Card>

      <Card padding="md" className="flex flex-col min-h-[420px] lg:min-h-[540px] animate-fade-up-delay">
        <CardHeader
          title="Result"
          action={
            result ? (
              <a href={result.url} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline flex items-center gap-1 font-medium">
                Open original
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ) : undefined
          }
        />

        {loading ? (
          <LoadingOverlay label={statusText ?? "Processing job on GPU…"} />
        ) : result ? (
          <div className="flex flex-1 flex-col gap-4 animate-fade-up">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="success">Completed</Badge>
            </div>
            <div className="flex items-center justify-center rounded-xl overflow-hidden bg-preview border border-border/40 min-h-[260px] max-h-[460px]">
              {result.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={result.url} alt={prompt} className="max-h-[440px] w-full object-contain" />
              ) : (
                <video src={result.url} controls autoPlay loop className="max-h-[440px] w-full" />
              )}
            </div>
            <div className="rounded-xl border border-border/60 bg-[var(--bg-sunken)]/80 p-3">
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
            <a href={result.url} download className="btn-secondary text-center text-sm !py-2">
              Download result
            </a>
          </div>
        ) : (
          <EmptyState
            title="No output yet"
            description="Fill out the prompt and click Generate to see the GPU result here."
          />
        )}
      </Card>
    </div>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}
