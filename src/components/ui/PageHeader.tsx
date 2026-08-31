interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-fade-up">
      <div>
        <h1 className="text-display-lg text-foreground">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-body-lg text-muted">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
