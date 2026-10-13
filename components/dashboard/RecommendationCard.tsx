import { Lightbulb } from 'lucide-react';

interface RecommendationCardProps {
  title: string;
  description: string;
}

export default function RecommendationCard({
  title,
  description,
}: RecommendationCardProps) {
  return (
    <div className="flex gap-3 rounded-lg border border-card-border bg-card p-4">
      <div className="flex-shrink-0">
        <div className="rounded-lg bg-primary/10 p-2">
          <Lightbulb className="h-4 w-4 text-primary" aria-hidden="true" />
        </div>
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
