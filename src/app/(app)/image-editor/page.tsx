import { ImageEditorForm } from "@/components/ImageEditorForm";

export default function ImageEditorPage() {
  return (
    <div className="animate-fade-up">
      <h1 className="mb-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
        Image Editor
      </h1>
      <p className="mb-8 max-w-xl text-muted">
        Upload an image and describe how to change it. InstructPix2Pix runs on
        in-house BridgeGPU — no external API.
      </p>
      <ImageEditorForm />
    </div>
  );
}
