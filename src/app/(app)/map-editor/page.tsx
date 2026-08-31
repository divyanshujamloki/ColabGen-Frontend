import { MapEditorForm } from "@/components/MapEditorForm";
import { PageHeader } from "@/components/ui";

export default function MapEditorPage() {
  return (
    <div>
      <PageHeader
        title="Map Journey"
        description="Place pins on the world map, connect them with paths, add captions, then render an animated journey video."
      />
      <MapEditorForm />
    </div>
  );
}
