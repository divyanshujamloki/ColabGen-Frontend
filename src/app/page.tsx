"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { getStoredEmail } from "@/lib/auth/session";
import { useEffect, useState } from "react";

const FEATURES = [
  {
    title: "Image & Video",
    description: "Generate SDXL images and short video clips from text prompts on dedicated GPU workers.",
    href: "/generate",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: "AI Chat",
    description: "Converse with your in-house LLM — no external API, full privacy on BridgeGPU.",
    href: "/chat",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    title: "Voice Synthesis",
    description: "XTTS-v2 text-to-speech with optional voice cloning from a short reference clip.",
    href: "/voice",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
  },
  {
    title: "Image Editing",
    description: "InstructPix2Pix edits — upload an image and describe the change you want.",
    href: "/image-editor",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
];

const STATS = [
  { value: "6", label: "AI tools" },
  { value: "100", label: "Free credits" },
  { value: "<30s", label: "Avg. generation" },
];

export default function HomePage() {
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    setEmail(getStoredEmail());
  }, []);

  return (
    <>
      <SiteHeader />
      <main className="relative flex flex-1 flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grid" aria-hidden />

        {/* Hero */}
        <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-col justify-center px-4 py-20 sm:px-6 sm:py-28 lg:py-32">
          <div className="max-w-3xl">
            <p className="animate-fade-up mb-4 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              In-house GPU compute
            </p>
            <h1 className="animate-fade-up text-display-xl text-foreground">
              GPUBridge
            </h1>
            <p className="animate-fade-up-delay mt-5 max-w-2xl text-body-lg text-foreground/85">
              Image and video generation, chat, voice, and editing — all running on
              your own BridgeGPU infrastructure with auth, job history, and
              Cloudinary delivery.
            </p>
            <p className="animate-fade-up-delay mt-3 max-w-lg text-muted">
              Sign in, prompt SDXL Turbo or a short clip, and watch results land
              in your history.
            </p>

            <div className="animate-fade-up-delay mt-10 flex flex-wrap gap-3">
              <Link href={email ? "/generate" : "/signup"} className="btn-primary">
                {email ? "Open studio" : "Get started free"}
              </Link>
              {!email ? (
                <Link href="/login" className="btn-secondary">
                  Sign in
                </Link>
              ) : (
                <Link href="/history" className="btn-secondary">
                  View history
                </Link>
              )}
            </div>

            {/* Stats */}
            <div className="animate-fade-up-delay mt-14 flex flex-wrap gap-8 border-t border-border/60 pt-8">
              {STATS.map((s) => (
                <div key={s.label}>
                  <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-accent">
                    {s.value}
                  </p>
                  <p className="text-sm text-muted">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="relative z-10 border-t border-border/40 bg-surface/30 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-12 max-w-xl">
              <h2 className="text-display-lg text-foreground">Everything in one studio</h2>
              <p className="mt-3 text-muted">
                Six AI tools powered by your own GPU workers — no third-party API keys required.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f, i) => (
                <Link
                  key={f.title}
                  href={email ? f.href : "/signup"}
                  className="card card-interactive group p-5 animate-fade-up"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent transition group-hover:bg-accent/20">
                    {f.icon}
                  </div>
                  <h3 className="font-[family-name:var(--font-display)] font-semibold text-foreground">
                    {f.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">
                    {f.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
