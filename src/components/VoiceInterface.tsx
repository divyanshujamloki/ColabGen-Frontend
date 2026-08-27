"use client";

import { DragEvent, FormEvent, useCallback, useRef, useState } from "react";
import { generateTts } from "@/lib/api/client";
import { ApiError, type TtsResponse } from "@/lib/api/types";
import { getAccessToken } from "@/lib/auth/session";

const inputClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2.5 text-foreground outline-none ring-accent focus:ring-2 disabled:opacity-60";

const MAX_AUDIO_MB = 8;

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "pl", label: "Polish" },
  { code: "tr", label: "Turkish" },
  { code: "ru", label: "Russian" },
  { code: "nl", label: "Dutch" },
  { code: "cs", label: "Czech" },
  { code: "ar", label: "Arabic" },
  { code: "zh-cn", label: "Chinese" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "hi", label: "Hindi" },
];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(new Error("Failed to read audio file"));
    reader.readAsDataURL(file);
  });
}

export function VoiceInterface() {
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("en");
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referenceName, setReferenceName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TtsResponse | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleFile = useCallback((file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("audio/") && !/\.(wav|mp3|m4a|ogg)$/i.test(file.name)) {
      setError("Please upload an audio file (WAV, MP3, M4A)");
      return;
    }
    if (file.size > MAX_AUDIO_MB * 1024 * 1024) {
      setError(`Audio must be under ${MAX_AUDIO_MB} MB`);
      return;
    }
    setError(null);
    setResult(null);
    setPlaybackUrl((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
    setReferenceFile(file);
    setReferenceName(file.name);
  }, []);

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0] ?? null);
  }

  function clearReference() {
    setReferenceFile(null);
    setReferenceName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setError(null);
    setResult(null);
    setLoading(true);
    setStatusText("Loading voice model on GPU (first call may take a minute)…");
    setPlaybackUrl((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });

    try {
      const accessToken = getAccessToken();
      if (!accessToken) throw new Error("Not signed in");

      let speakerWavBase64: string | undefined;
      if (referenceFile) {
        setStatusText("Encoding reference voice…");
        speakerWavBase64 = await fileToBase64(referenceFile);
      }

      setStatusText("Synthesizing on BridgeGPU…");

      const data = await generateTts(accessToken, {
        text: trimmed,
        speaker_wav_base64: speakerWavBase64,
        language,
      });

      setResult(data);
      const dataUrl = `data:audio/wav;base64,${data.audio_base64}`;
      setPlaybackUrl(dataUrl);
      setStatusText(null);

      requestAnimationFrame(() => {
        void audioRef.current?.play().catch(() => {
          /* autoplay may be blocked */
        });
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Voice generation failed");
      }
      setStatusText(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={onSubmit} className="space-y-5 rounded-lg border border-border bg-surface/60 p-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Text to speak
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={inputClass}
            rows={5}
            placeholder="Enter the words you want spoken…"
            maxLength={2000}
            disabled={loading}
            required
          />
          <p className="mt-1 text-right font-mono text-[11px] text-muted">
            {text.length}/2000
          </p>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`rounded-lg border border-dashed px-4 py-6 text-center transition ${
            dragOver
              ? "border-accent bg-accent/10"
              : "border-border bg-surface-soft/40"
          }`}
        >
          <p className="mb-1 text-sm font-medium text-foreground">
            Reference voice (optional)
          </p>
          <p className="mb-3 text-xs text-muted">
            Drop a clean 5–15s clip for cloning. Single speaker, no music.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/wav,audio/mpeg,audio/mp3,audio/mp4,audio/x-m4a,audio/ogg,.wav,.mp3,.m4a"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            disabled={loading}
          />
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground transition hover:border-accent/50 disabled:opacity-50"
            >
              Choose audio
            </button>
            {referenceName ? (
              <>
                <span className="max-w-[12rem] truncate font-mono text-xs text-accent">
                  {referenceName}
                </span>
                <button
                  type="button"
                  onClick={clearReference}
                  disabled={loading}
                  className="text-xs text-muted underline hover:text-foreground"
                >
                  Clear
                </button>
              </>
            ) : (
              <span className="text-xs text-muted">Using default speaker</span>
            )}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className={inputClass}
            disabled={loading}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        ) : null}
        {statusText ? (
          <p className="flex items-center gap-2 text-sm text-muted">
            <span
              className="h-4 w-4 rounded-full border-2 border-accent border-t-transparent animate-spin-ring"
              aria-hidden
            />
            {statusText}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading || !text.trim()}
          className={`w-full rounded-md px-6 py-2.5 font-[family-name:var(--font-display)] font-semibold transition ${
            loading || !text.trim()
              ? "cursor-not-allowed bg-surface-soft text-muted"
              : "bg-accent text-[#0c1218] hover:bg-accent-dim"
          }`}
        >
          {loading ? "Generating voice…" : "Generate voice"}
        </button>
      </form>

      <div className="flex min-h-[280px] flex-col rounded-lg border border-border bg-surface/60 p-5">
        <h2 className="mb-1 font-[family-name:var(--font-display)] text-lg font-semibold">
          Result
        </h2>
        <p className="mb-4 text-xs text-muted">
          Free in-house XTTS on BridgeGPU. Playback is immediate; a copy is saved to history.
        </p>

        {loading && !playbackUrl ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted">
            <span
              className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin-ring"
              aria-hidden
            />
            <p className="text-sm">Synthesizing…</p>
          </div>
        ) : playbackUrl ? (
          <div className="flex flex-1 flex-col gap-4">
            <audio
              ref={audioRef}
              controls
              src={playbackUrl}
              className="w-full"
            />
            {result ? (
              <dl className="grid grid-cols-2 gap-2 font-mono text-[11px] text-muted">
                <div>
                  <dt className="opacity-70">Model</dt>
                  <dd className="text-foreground">XTTS-v2</dd>
                </div>
                <div>
                  <dt className="opacity-70">Format</dt>
                  <dd className="text-foreground">{result.format}</dd>
                </div>
                <div>
                  <dt className="opacity-70">Inference</dt>
                  <dd className="text-foreground">{result.inference_ms} ms</dd>
                </div>
                <div>
                  <dt className="opacity-70">Job</dt>
                  <dd className="truncate text-foreground">{result.id.slice(0, 8)}…</dd>
                </div>
              </dl>
            ) : null}
            {result?.url ? (
              <div className="mt-auto flex flex-wrap gap-3">
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent hover:underline"
                >
                  Open Cloudinary URL
                </a>
                <a
                  href={playbackUrl}
                  download={`gpubridge-voice.${result.format}`}
                  className="text-sm text-muted hover:text-foreground hover:underline"
                >
                  Download
                </a>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted">
            Generated audio will appear here.
          </div>
        )}
      </div>
    </div>
  );
}
