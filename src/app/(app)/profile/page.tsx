import { ProfileView } from "@/components/ProfileView";
import { PageHeader } from "@/components/ui";

export default function ProfilePage() {
  return (
    <div>
      <PageHeader title="Profile" description="Manage your account, credits, and security settings." />
      <ProfileView />
    </div>
  );
}
