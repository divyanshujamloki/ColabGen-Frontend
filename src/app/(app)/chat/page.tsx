import { ChatInterface } from "@/components/ChatInterface";

export default function ChatPage() {
  return (
    <div className="animate-fade-up flex flex-col">
      <div className="mb-6">
        <h1 className="mb-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
          AI Chat
        </h1>
        <p className="max-w-xl text-muted">
          Chat with Llama 3.2 on your Colab GPU. No external API — runs locally on
          your free GPU worker.
        </p>
      </div>
      <ChatInterface />
    </div>
  );
}
