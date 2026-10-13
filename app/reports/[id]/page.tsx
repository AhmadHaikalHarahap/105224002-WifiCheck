import { Suspense } from 'react';
import { mockAssessments } from '@/data/mock-assessments';
import ReportDetailClient from './ReportDetailClient';

interface ReportPageProps {
  params: Promise<{
    id: string;
  }>;
}

export function generateStaticParams() {
  return mockAssessments.map((item) => ({
    id: item.id,
  }));
}

export default function ReportDetailPage({ params }: ReportPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="flex items-center gap-3 text-slate-600 text-sm">
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent"
              aria-hidden="true"
            />
            <span>Loading security assessment report...</span>
          </div>
        </div>
      }
    >
      <ReportDetailClient params={params} />
    </Suspense>
  );
}

