"use client";

import { DragEvent, FormEvent, useCallback, useRef, useState } from "react";
import { generateImg2Img } from "@/lib/api/client";
import { ApiError, type GenerateResult } from "@/lib/api/types";
import { getAccessToken } from "@/lib/auth/session";

const inputClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground outline-none ring-accent focus:ring-2 disabled:opacity-60";

const MAX_FILE_MB = 8;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? "";
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function ImageEditorForm() {
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
    const file = e.dataTransfer.files[0];
    handleFile(file ?? null);
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
                ? `Job ${job.id.slice(0, 8)}… editing (polling)`
                : `Job ${job.status}`,
            );
          },
        },
      );

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
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <form onSubmit={onSubmit} className="space-y-5">
        <div
          role="button"
          tabIndex={0}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
          }}
          className={`flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition ${
            dragOver
              ? "border-accent bg-accent/5"
              : "border-border bg-surface/40 hover:border-accent/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          {sourcePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sourcePreview}
              alt="Source"
              className="max-h-40 max-w-full rounded-md object-contain"
            />
          ) : (
            <>
              <p className="font-[family-name:var(--font-display)] text-sm font-medium">
                Drop an image here
              </p>
              <p className="mt-1 text-xs text-muted">or click to browse (max {MAX_FILE_MB} MB)</p>
            </>
          )}
        </div>

        <div>
          <label htmlFor="edit-prompt" className="mb-1.5 block text-sm text-muted">
            Edit instruction
          </label>
          <textarea
            id="edit-prompt"
            required
            maxLength={2000}
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
            placeholder="make the sky sunset orange, add sunglasses, turn into watercolor style"
            className={`${inputClass} resize-y py-2.5`}
          />
        </div>

        <div>
          <label htmlFor="edit-negative" className="mb-1.5 block text-sm text-muted">
            Negative prompt (optional)
          </label>
          <input
            id="edit-negative"
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            disabled={loading}
            className={`${inputClass} py-2.5`}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Steps (10–50)" id="edit-steps">
            <input
              id="edit-steps"
              type="number"
              min={10}
              max={50}
              value={steps}
              onChange={(e) => setSteps(Number(e.target.value))}
              disabled={loading}
              className={inputClass}
            />
          </Field>
          <Field label="Guidance" id="edit-guidance">
            <input
              id="edit-guidance"
              type="number"
              min={1}
              max={15}
              step={0.5}
              value={guidance}
              onChange={(e) => setGuidance(Number(e.target.value))}
              disabled={loading}
              className={inputClass}
            />
          </Field>
          <Field label="Image guidance" id="edit-img-guidance">
            <input
              id="edit-img-guidance"
              type="number"
              min={1}
              max={3}
              step={0.1}
              value={imageGuidance}
              onChange={(e) => setImageGuidance(Number(e.target.value))}
              disabled={loading}
              className={inputClass}
            />
          </Field>
          <Field label="Seed (optional)" id="edit-seed">
            <input
              id="edit-seed"
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
          disabled={loading || !prompt.trim() || !sourceFile}
          className={`w-full rounded-md bg-accent py-3 font-[family-name:var(--font-display)] text-base font-semibold text-[#0c1218] transition hover:bg-accent-dim disabled:opacity-60 ${
            loading ? "animate-pulse-glow" : ""
          }`}
        >
          {loading ? "Editing image…" : "Apply edit"}
        </button>
        <p className="text-xs text-muted">
          Uses InstructPix2Pix on your Colab GPU. Typically 10–30 seconds.
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
            <p className="text-center text-sm">{statusText ?? "Processing…"}</p>
          </div>
        ) : result ? (
          <div className="flex flex-1 flex-col gap-4 animate-fade-up">
            <div className="grid gap-3 sm:grid-cols-2">
              {sourcePreview ? (
                <div>
                  <p className="mb-1 font-mono text-xs text-muted">Before</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sourcePreview}
                    alt="Before"
                    className="max-h-[200px] w-full rounded-md object-contain bg-black/40"
                  />
                </div>
              ) : null}
              <div className={sourcePreview ? "" : "sm:col-span-2"}>
                <p className="mb-1 font-mono text-xs text-muted">After</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.url}
                  alt={prompt}
                  className="max-h-[200px] w-full rounded-md object-contain bg-black/40"
                />
              </div>
            </div>
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
                  {result.inferenceMs != null ? `${result.inferenceMs} ms` : "—"}
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
            Edited image appears here after a successful run.
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
