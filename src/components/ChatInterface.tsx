"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { sendChatMessage } from "@/lib/api/client";
import { ApiError, type ChatMessage } from "@/lib/api/types";
import { getAccessToken } from "@/lib/auth/session";

type UiMessage = ChatMessage & { id: string };

const inputClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2.5 text-foreground outline-none ring-accent focus:ring-2 disabled:opacity-60";

export function ChatInterface() {
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm your in-house chat model running on your Colab GPU. Ask me anything — coding help, ideas, or general questions.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setError(null);
    setInput("");

    const userMsg: UiMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    const nextMessages = [...messages.filter((m) => m.id !== "welcome"), userMsg];
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

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.response,
        },
      ]);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Chat failed");
      }
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

  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col rounded-lg border border-border bg-surface/60 lg:min-h-[640px]">
      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6"
        aria-live="polite"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex animate-fade-up ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[75%] ${
                msg.role === "user"
                  ? "rounded-br-md bg-accent text-[#0c1218]"
                  : "rounded-bl-md border border-border bg-surface-soft text-foreground"
              }`}
            >
              <p className="mb-1 font-mono text-[10px] uppercase tracking-wider opacity-70">
                {msg.role === "user" ? "You" : "In-house model"}
              </p>
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading ? (
          <div className="flex justify-start animate-fade-up">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-border bg-surface-soft px-4 py-3 text-sm text-muted">
              <span
                className="h-4 w-4 rounded-full border-2 border-accent border-t-transparent animate-spin-ring"
                aria-hidden
              />
              Thinking…
            </div>
          </div>
        ) : null}
      </div>

      <form
        onSubmit={onSubmit}
        className="border-t border-border p-4 sm:p-6"
      >
        {error ? (
          <p className="mb-3 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label htmlFor="chat-input" className="sr-only">
              Message
            </label>
            <textarea
              ref={inputRef}
              id="chat-input"
              rows={2}
              maxLength={4000}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={loading}
              placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
              className={`${inputClass} resize-none`}
            />
            <p className="mt-1 text-right font-mono text-xs text-muted">
              {input.length}/4000
            </p>
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="shrink-0 rounded-md bg-accent px-6 py-3 font-[family-name:var(--font-display)] text-sm font-semibold text-[#0c1218] transition hover:bg-accent-dim disabled:opacity-60 sm:py-2.5"
          >
            {loading ? "Sending…" : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
