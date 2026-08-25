import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <SiteHeader email={user?.email} />
      <main className="relative flex flex-1 flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grid" aria-hidden />
        <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-20 sm:px-6 sm:py-28">
          <p className="animate-fade-up mb-4 font-[family-name:var(--font-display)] text-5xl font-bold tracking-tight text-foreground sm:text-7xl md:text-8xl">
            GPUBridge
          </p>
          <h1 className="animate-fade-up-delay max-w-2xl font-[family-name:var(--font-display)] text-2xl font-medium leading-snug text-foreground/90 sm:text-3xl">
            Image and video generation on your Colab GPU — auth, jobs, and
            Cloudinary delivery in one control plane.
          </h1>
          <p className="animate-fade-up-delay mt-4 max-w-lg text-base text-muted sm:text-lg">
            Sign in, prompt SDXL Turbo or a short clip, and watch results land
            in your history.
          </p>
          <div className="animate-fade-up-delay mt-10 flex flex-wrap gap-3">
            <Link
              href={user ? "/generate" : "/signup"}
              className="rounded-md bg-accent px-6 py-3 font-[family-name:var(--font-display)] font-semibold text-[#0c1218] transition hover:bg-accent-dim"
            >
              {user ? "Open studio" : "Get started"}
            </Link>
            {!user ? (
              <Link
                href="/login"
                className="rounded-md border border-border px-6 py-3 font-medium text-foreground transition hover:border-accent/40 hover:text-accent"
              >
                Sign in
              </Link>
            ) : (
              <Link
                href="/history"
                className="rounded-md border border-border px-6 py-3 font-medium text-foreground transition hover:border-accent/40 hover:text-accent"
              >
                History
              </Link>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
