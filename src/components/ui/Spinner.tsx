interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

const sizeClass = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export function Spinner({ size = "md", label, className = "" }: SpinnerProps) {
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`} role="status">
      <span
        className={`rounded-full border-2 border-accent/20 border-t-accent animate-spin-ring ${sizeClass[size]}`}
        aria-hidden
      />
      {label ? <p className="text-sm text-muted">{label}</p> : null}
      <span className="sr-only">{label ?? "Loading"}</span>
    </div>
  );
}

export function LoadingOverlay({ label }: { label?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-12">
      <div className="relative flex items-center justify-center">
        <span className="h-12 w-12 rounded-full border-2 border-accent/20 border-t-accent animate-spin-ring" />
        <span className="absolute h-6 w-6 rounded-full bg-accent/15 animate-pulse" />
      </div>
      {label ? (
        <p className="text-sm font-medium text-foreground">{label}</p>
      ) : null}
    </div>
  );
}
