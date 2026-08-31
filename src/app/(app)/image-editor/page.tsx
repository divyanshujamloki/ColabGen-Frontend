import { ImageEditorForm } from "@/components/ImageEditorForm";
import { PageHeader } from "@/components/ui";

export default function ImageEditorPage() {
  return (
    <div>
      <PageHeader
        title="Image Editor"
        description="Upload an image and describe how to change it. InstructPix2Pix runs on in-house BridgeGPU."
      />
      <ImageEditorForm />
    </div>
  );
}
