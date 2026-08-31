"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { sendChatMessage } from "@/lib/api/client";
import { ApiError, type ChatMessage } from "@/lib/api/types";
import { getAccessToken } from "@/lib/auth/session";
import { useCredits } from "@/lib/credits/CreditsContext";
import { Alert, Button, Card } from "@/components/ui";

type UiMessage = ChatMessage & { id: string };

const EXAMPLE_PROMPTS = [
  "Explain how diffusion models work",
  "Write a Python function to sort a list",
  "What are best practices for GPU inference?",
];

export function ChatInterface() {
  const { deductCredits } = useCredits();
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setError(null);
    setInput("");

    const userMsg: UiMessage = { id: crypto.randomUUID(), role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const accessToken = getAccessToken();
      if (!accessToken) throw new Error("Not signed in");

      const apiMessages = nextMessages.map(({ role, content }) => ({ role, content }));
      const result = await sendChatMessage(accessToken, {
        messages: apiMessages,
        max_tokens: 512,
        temperature: 0.7,
      });

      deductCredits(5, "Chat Assistant");
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: result.response },
      ]);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Chat failed");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void onSubmit(e as unknown as FormEvent);
    }
  }

  function copyMessage(content: string) {
    navigator.clipboard.writeText(content);
  }

  return (
    <Card padding="none" className="flex min-h-[calc(100vh-14rem)] flex-col lg:min-h-[640px] overflow-hidden">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6" aria-live="polite">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-2xl bg-accent/10 p-4 text-accent">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="font-[family-name:var(--font-display)] text-lg font-semibold">Start a conversation</p>
            <p className="mt-1 max-w-sm text-sm text-muted">
              Ask anything — coding help, ideas, or general questions on BridgeGPU.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {EXAMPLE_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setInput(p)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs text-muted transition hover:border-accent/40 hover:text-accent"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex animate-fade-up ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`group relative max-w-[85%] sm:max-w-[75%] ${msg.role === "user" ? "order-1" : ""}`}>
                <div className="mb-1 flex items-center gap-2">
                  {msg.role === "assistant" ? (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 text-[10px] font-bold text-accent">AI</span>
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-soft text-[10px] font-bold text-muted ml-auto">You</span>
                  )}
                </div>
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "rounded-br-md bg-accent text-[var(--btn-primary-fg)]"
                      : "rounded-bl-md border border-border bg-surface-soft text-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
                {msg.role === "assistant" ? (
                  <button
                    type="button"
                    onClick={() => copyMessage(msg.content)}
                    className="absolute -bottom-5 left-0 text-[10px] text-muted opacity-0 transition group-hover:opacity-100 hover:text-foreground"
                  >
                    Copy
                  </button>
                ) : null}
              </div>
            </div>
          ))
        )}

        {loading ? (
          <div className="flex justify-start animate-fade-up">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-border bg-surface-soft px-4 py-3 text-sm text-muted">
              <span className="h-4 w-4 rounded-full border-2 border-accent border-t-transparent animate-spin-ring" aria-hidden />
              Thinking…
            </div>
          </div>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="border-t border-border p-4 sm:p-6 bg-surface/50">
        {error ? <Alert variant="error" className="mb-3">{error}</Alert> : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label htmlFor="chat-input" className="sr-only">Message</label>
            <textarea
              ref={inputRef}
              id="chat-input"
              rows={2}
              maxLength={4000}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={loading}
              placeholder="Type a message… (Enter to send)"
              className="input-base resize-none"
            />
            <div className="mt-1 flex justify-between text-xs text-muted">
              <span>5 credits per message</span>
              <span className="font-mono">{input.length}/4000</span>
            </div>
          </div>
          <Button type="submit" disabled={loading || !input.trim()} loading={loading}>
            Send
          </Button>
        </div>
      </form>
    </Card>
  );
}
