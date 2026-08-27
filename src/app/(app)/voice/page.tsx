import { VoiceInterface } from "@/components/VoiceInterface";

export default function VoicePage() {
  return (
    <div className="animate-fade-up flex flex-col">
      <div className="mb-6">
        <h1 className="mb-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
          Voice Studio
        </h1>
        <p className="max-w-xl text-muted">
          Free text-to-speech and voice cloning on in-house BridgeGPU (XTTS-v2).
          Upload a clean 5–15 second reference clip, or use the default speaker.
          No paid APIs.
        </p>
      </div>
      <VoiceInterface />
    </div>
  );
}
