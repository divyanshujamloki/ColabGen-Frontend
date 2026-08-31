import { GenerateForm } from "@/components/GenerateForm";
import { PageHeader } from "@/components/ui";

export default function GeneratePage() {
  return (
    <div>
      <PageHeader
        title="Generate"
        description="Create AI-generated images and videos from text descriptions. Results are saved to your history."
      />
      <GenerateForm />
    </div>
  );
}
