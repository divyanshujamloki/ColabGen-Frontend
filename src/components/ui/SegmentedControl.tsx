interface Option<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
  className = "",
}: SegmentedControlProps<T>) {
  return (
    <div
      className={`flex rounded-xl border border-border/70 bg-[var(--bg-sunken)] p-1 ${className}`}
      role="tablist"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={value === opt.value}
          disabled={disabled}
          onClick={() => onChange(opt.value)}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all duration-200 disabled:opacity-50 ${
            value === opt.value
              ? "bg-accent text-[var(--btn-primary-fg)] shadow-sm font-semibold"
              : "text-muted hover:text-foreground"
          }`}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
}
