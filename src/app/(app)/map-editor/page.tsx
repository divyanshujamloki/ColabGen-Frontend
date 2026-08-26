import { MapEditorForm } from "@/components/MapEditorForm";

export default function MapEditorPage() {
  return (
    <div className="animate-fade-up">
      <h1 className="mb-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
        Map Journey
      </h1>
      <p className="mb-8 max-w-xl text-muted">
        Place pins on the world map, connect them with paths, add captions, then
        render an animated journey video.
      </p>
      <MapEditorForm />
    </div>
  );
}
