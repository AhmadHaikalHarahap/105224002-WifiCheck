import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: number;
  description?: string;
  /** Accent color class for the icon background */
  accentColor?: string;
  /** Accent text color for the icon */
  iconColor?: string;
}

export default function StatCard({
  icon: Icon,
  title,
  value,
  description,
  accentColor = 'bg-primary/10',
  iconColor = 'text-primary',
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-4">
        {/* Icon container */}
        <div className={`flex-shrink-0 rounded-lg p-2.5 ${accentColor}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted">{title}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
          {description && (
            <p className="mt-1 text-xs text-muted">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
