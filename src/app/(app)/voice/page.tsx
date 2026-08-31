import { VoiceInterface } from "@/components/VoiceInterface";
import { PageHeader } from "@/components/ui";

export default function VoicePage() {
  return (
    <div>
      <PageHeader
        title="Voice Studio"
        description="Free text-to-speech and voice cloning on in-house BridgeGPU (XTTS-v2). Upload a reference clip or use the default speaker."
      />
      <VoiceInterface />
    </div>
  );
}
