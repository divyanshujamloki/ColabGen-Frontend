"use client";

import { DragEvent, FormEvent, useCallback, useRef, useState } from "react";
import { generateImg2Img } from "@/lib/api/client";
import { ApiError, type GenerateResult } from "@/lib/api/types";
import { getAccessToken } from "@/lib/auth/session";
import { useCredits } from "@/lib/credits/CreditsContext";
import { Alert, Button, Card, CardHeader, EmptyState, LoadingOverlay, Textarea } from "@/components/ui";

const MAX_FILE_MB = 8;
const inputClass = "input-base disabled:opacity-60";

const PRESETS = [
  "make the sky sunset orange",
  "add sunglasses to the person",
  "turn into watercolor style",
  "enhance colors and sharpness",
];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function ImageEditorForm() {
  const { deductCredits } = useCredits();
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [steps, setSteps] = useState(20);
  const [guidance, setGuidance] = useState(7.5);
  const [imageGuidance, setImageGuidance] = useState(1.5);
  const [seed, setSeed] = useState("");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleFile = useCallback((file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, WebP)");
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`Image must be under ${MAX_FILE_MB} MB`);
      return;
    }
    setError(null);
    setResult(null);
    setSourceFile(file);
    const url = URL.createObjectURL(file);
    setSourcePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  }, []);

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0] ?? null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!sourceFile) {
      setError("Upload an image first");
      return;
    }

    setError(null);
    setResult(null);
    setLoading(true);
    setStatusText("Uploading & submitting job…");

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const accessToken = getAccessToken();
      if (!accessToken) throw new Error("Not signed in");

      const image_base64 = await fileToBase64(sourceFile);
      const seedNum = seed.trim() === "" ? null : Number(seed);
      if (seed.trim() !== "" && !Number.isFinite(seedNum)) {
        throw new Error("Seed must be an integer");
      }

      const data = await generateImg2Img(
        accessToken,
        {
          prompt,
          image_base64,
          negative_prompt: negativePrompt || null,
          steps,
          guidance_scale: guidance,
          image_guidance_scale: imageGuidance,
          seed: seedNum,
        },
        {
          signal: ac.signal,
          onUpdate: (job) => {
            setStatusText(
              job.status === "running"
                ? `Job ${job.id.slice(0, 8)}… editing`
                : `Job ${job.status}`,
            );
          },
        },
      );

      deductCredits(5, "Image Editing");
      setResult(data);
      setStatusText(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.jobId ? `${err.message} (job ${err.jobId})` : err.message);
      } else if (err instanceof Error) {
        if (err.message !== "Polling cancelled") setError(err.message);
      } else {
        setError("Image edit failed");
      }
      setStatusText(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 items-start">
      <Card padding="md" className="animate-fade-up">
        <form onSubmit={onSubmit} className="space-y-5">
          <div
            role="button"
            tabIndex={0}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
            className={`flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition ${
              dragOver ? "border-accent bg-accent/5" : "border-border bg-[var(--bg-sunken)]/40 hover:border-accent/40"
            }`}
          >
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
            {sourcePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sourcePreview} alt="Source" className="max-h-40 max-w-full rounded-lg object-contain" />
            ) : (
              <>
                <svg className="mb-2 h-8 w-8 text-muted/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="font-[family-name:var(--font-display)] text-sm font-medium">Drop an image here</p>
                <p className="mt-1 text-xs text-muted">or click to browse (max {MAX_FILE_MB} MB)</p>
              </>
            )}
          </div>

          <Textarea
            label="Edit instruction *"
            required
            maxLength={2000}
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
            placeholder="Describe the change you want…"
          />

          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                disabled={loading}
                onClick={() => setPrompt(p)}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted transition hover:border-accent/40 hover:text-accent disabled:opacity-50"
              >
                {p}
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() => setShowAdvanced((s) => !s)}
            className="text-xs text-muted hover:text-accent transition"
          >
            {showAdvanced ? "Hide" : "Show"} advanced options
          </button>

          {showAdvanced ? (
            <div className="space-y-3 rounded-xl border border-border/50 bg-[var(--bg-sunken)]/60 p-3.5 animate-fade-in">
              <div>
                <label htmlFor="edit-negative" className="mb-1.5 block text-sm text-muted">Negative prompt</label>
                <input id="edit-negative" value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} disabled={loading} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Field label="Steps" id="edit-steps">
                  <input id="edit-steps" type="number" min={10} max={50} value={steps} onChange={(e) => setSteps(Number(e.target.value))} disabled={loading} className={inputClass} />
                </Field>
                <Field label="Guidance" id="edit-guidance">
                  <input id="edit-guidance" type="number" min={1} max={15} step={0.5} value={guidance} onChange={(e) => setGuidance(Number(e.target.value))} disabled={loading} className={inputClass} />
                </Field>
                <Field label="Img guidance" id="edit-img-guidance">
                  <input id="edit-img-guidance" type="number" min={1} max={3} step={0.1} value={imageGuidance} onChange={(e) => setImageGuidance(Number(e.target.value))} disabled={loading} className={inputClass} />
                </Field>
                <Field label="Seed" id="edit-seed">
                  <input id="edit-seed" type="text" inputMode="numeric" value={seed} onChange={(e) => setSeed(e.target.value)} disabled={loading} placeholder="Random" className={inputClass} />
                </Field>
              </div>
            </div>
          ) : null}

          {error ? <Alert variant="error">{error}</Alert> : null}

          <div className="text-xs text-muted">Cost: <strong className="text-accent">5 credits</strong> · ~10–30s on GPU</div>

          <Button type="submit" fullWidth loading={loading} disabled={!prompt.trim() || !sourceFile}>
            {loading ? "Editing image…" : "Apply edit"}
          </Button>
        </form>
      </Card>

      <Card padding="md" className="flex min-h-[320px] flex-col animate-fade-up-delay">
        <CardHeader title="Result" description="Before and after comparison" />
        {loading ? (
          <LoadingOverlay label={statusText ?? "Processing…"} />
        ) : result ? (
          <div className="flex flex-1 flex-col gap-4 animate-fade-up">
            <div className="grid gap-3 sm:grid-cols-2">
              {sourcePreview ? (
                <div>
                  <p className="mb-1.5 text-caption">Before</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={sourcePreview} alt="Before" className="w-full rounded-lg object-contain bg-preview max-h-[220px]" />
                </div>
              ) : null}
              <div className={sourcePreview ? "" : "sm:col-span-2"}>
                <p className="mb-1.5 text-caption">After</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={result.url} alt={prompt} className="w-full rounded-lg object-contain bg-preview max-h-[220px]" />
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-2 font-mono text-xs text-muted">
              <div><dt>Job</dt><dd className="truncate text-foreground">{result.id.slice(0, 10)}…</dd></div>
              <div><dt>Seed</dt><dd className="text-foreground">{result.seed ?? "—"}</dd></div>
              <div><dt>Inference</dt><dd className="text-foreground">{result.inferenceMs != null ? `${result.inferenceMs} ms` : "—"}</dd></div>
            </dl>
            <a href={result.url} download className="btn-secondary text-center text-sm !py-2">Download result</a>
          </div>
        ) : (
          <EmptyState title="No edit yet" description="Upload an image and describe the change to see the result." />
        )}
      </Card>
    </div>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">{label}</label>
      {children}
    </div>
  );
}
