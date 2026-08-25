import { GenerateForm } from "@/components/GenerateForm";

export default function GeneratePage() {
  return (
    <div className="animate-fade-up">
      <h1 className="mb-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
        Generate
      </h1>
      <p className="mb-8 max-w-xl text-muted">
        Create AI-generated images and videos from text descriptions. 
        Results are saved to your history.
      </p>
      <GenerateForm />
    </div>
  );
}
