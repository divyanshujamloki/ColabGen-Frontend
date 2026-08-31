import { ChatInterface } from "@/components/ChatInterface";
import { PageHeader } from "@/components/ui";

export default function ChatPage() {
  return (
    <div className="flex flex-col">
      <PageHeader
        title="AI Chat"
        description="Chat with your in-house BridgeGPU model. No external API — runs on your own GPU worker."
      />
      <ChatInterface />
    </div>
  );
}
