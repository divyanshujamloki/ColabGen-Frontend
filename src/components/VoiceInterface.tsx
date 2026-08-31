"use client";

import { DragEvent, FormEvent, useCallback, useRef, useState } from "react";
import { generateTts } from "@/lib/api/client";
import { ApiError, type TtsResponse } from "@/lib/api/types";
import { getAccessToken } from "@/lib/auth/session";
import { useCredits } from "@/lib/credits/CreditsContext";
import { Alert, Button, Card, CardHeader, EmptyState, LoadingOverlay, Textarea } from "@/components/ui";

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
  const { deductCredits } = useCredits();
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

      deductCredits(5, "Voice TTS Synthesis");
      setResult(data);
      setPlaybackUrl(`data:audio/wav;base64,${data.audio_base64}`);
      setStatusText(null);

      requestAnimationFrame(() => {
        void audioRef.current?.play().catch(() => {});
      });
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Voice generation failed");
      setStatusText(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 items-start">
      <Card padding="md" className="animate-fade-up">
        <form onSubmit={onSubmit} className="space-y-5">
          <Textarea
            label="Text to speak"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            maxLength={2000}
            showCount
            disabled={loading}
            required
            placeholder="Enter the words you want spoken…"
          />

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`rounded-xl border border-dashed px-4 py-6 text-center transition ${
              dragOver ? "border-accent bg-accent/10" : "border-border bg-[var(--bg-sunken)]/40"
            }`}
          >
            <svg className="mx-auto mb-2 h-8 w-8 text-muted/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <p className="text-sm font-medium text-foreground">Reference voice (optional)</p>
            <p className="mb-3 text-xs text-muted">Drop a clean 5–15s clip for voice cloning</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/wav,audio/mpeg,audio/mp3,audio/mp4,audio/x-m4a,audio/ogg,.wav,.mp3,.m4a"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              disabled={loading}
            />
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} disabled={loading}>
                Choose audio
              </Button>
              {referenceName ? (
                <>
                  <span className="max-w-[12rem] truncate font-mono text-xs text-accent">{referenceName}</span>
                  <button type="button" onClick={clearReference} disabled={loading} className="text-xs text-muted underline hover:text-foreground">Clear</button>
                </>
              ) : (
                <span className="text-xs text-muted">Using default speaker</span>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted">Language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="input-base" disabled={loading}>
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>

          {error ? <Alert variant="error">{error}</Alert> : null}
          {statusText ? (
            <p className="flex items-center gap-2 text-sm text-muted">
              <span className="h-4 w-4 rounded-full border-2 border-accent border-t-transparent animate-spin-ring" aria-hidden />
              {statusText}
            </p>
          ) : null}

          <div className="flex items-center justify-between text-xs text-muted">
            <span>Cost: <strong className="text-accent">5 credits</strong></span>
          </div>

          <Button type="submit" fullWidth loading={loading} disabled={!text.trim()}>
            {loading ? "Generating voice…" : "Generate voice"}
          </Button>
        </form>
      </Card>

      <Card padding="md" className="flex min-h-[320px] flex-col animate-fade-up-delay">
        <CardHeader title="Result" description="XTTS-v2 on BridgeGPU. Playback is immediate." />
        {loading && !playbackUrl ? (
          <LoadingOverlay label="Synthesizing…" />
        ) : playbackUrl ? (
          <div className="flex flex-1 flex-col gap-4 animate-fade-up">
            <div className="rounded-xl border border-border/60 bg-[var(--bg-sunken)] p-4">
              <audio ref={audioRef} controls src={playbackUrl} className="w-full" />
            </div>
            {result ? (
              <dl className="grid grid-cols-2 gap-2 font-mono text-[11px] text-muted">
                <div><dt className="opacity-70">Model</dt><dd className="text-foreground">XTTS-v2</dd></div>
                <div><dt className="opacity-70">Format</dt><dd className="text-foreground">{result.format}</dd></div>
                <div><dt className="opacity-70">Inference</dt><dd className="text-foreground">{result.inference_ms} ms</dd></div>
                <div><dt className="opacity-70">Job</dt><dd className="truncate text-foreground">{result.id.slice(0, 8)}…</dd></div>
              </dl>
            ) : null}
            <div className="mt-auto flex flex-wrap gap-3">
              {result?.url ? (
                <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline">Open URL</a>
              ) : null}
              <a href={playbackUrl} download={`gpubridge-voice.${result?.format ?? "wav"}`} className="btn-secondary !text-sm !py-2 !px-4">Download</a>
            </div>
          </div>
        ) : (
          <EmptyState title="No audio yet" description="Enter text and generate to hear the result." />
        )}
      </Card>
    </div>
  );
}
