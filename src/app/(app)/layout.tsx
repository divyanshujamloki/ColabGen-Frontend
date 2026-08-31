import { HealthBadge } from "@/components/HealthBadge";
import { SiteHeader } from "@/components/SiteHeader";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-6xl items-center px-4 py-3 sm:px-6">
        <HealthBadge />
      </div>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 sm:px-6">
        {children}
      </main>
    </>
  );
}
