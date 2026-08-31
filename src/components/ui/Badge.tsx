type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "accent";

const variantClass: Record<BadgeVariant, string> = {
  default: "border-border/60 bg-surface-soft text-muted",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  danger: "border-danger/30 bg-danger/10 text-danger",
  info: "border-info/30 bg-info/10 text-info",
  accent: "border-accent/30 bg-accent/10 text-accent",
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  pulse?: boolean;
  className?: string;
}

export function Badge({ children, variant = "default", pulse = false, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${variantClass[variant]} ${pulse ? "animate-pulse" : ""} ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const variant: BadgeVariant =
    normalized === "succeeded" || normalized === "active" || normalized === "completed"
      ? "success"
      : normalized === "failed" || normalized === "error"
        ? "danger"
        : normalized === "running" || normalized === "pending" || normalized === "queued"
          ? "warning"
          : "default";

  return (
    <Badge variant={variant} pulse={normalized === "running" || normalized === "pending"}>
      {status}
    </Badge>
  );
}
