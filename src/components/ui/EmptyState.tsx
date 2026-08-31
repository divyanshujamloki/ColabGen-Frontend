import Link from "next/link";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; href: string };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-surface-soft/30 px-6 py-14 text-center animate-fade-up">
      <div className="mb-4 rounded-2xl bg-surface-soft p-4 text-muted/70">
        {icon ?? (
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        )}
      </div>
      <p className="font-[family-name:var(--font-display)] text-base font-semibold text-foreground/90">
        {title}
      </p>
      {description ? (
        <p className="mt-1.5 max-w-xs text-sm text-muted">{description}</p>
      ) : null}
      {action ? (
        <Link href={action.href} className="mt-5">
          <Button variant="secondary" size="sm">{action.label}</Button>
        </Link>
      ) : null}
    </div>
  );
}
