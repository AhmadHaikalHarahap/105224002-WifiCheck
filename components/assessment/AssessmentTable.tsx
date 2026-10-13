import Link from 'next/link';
import { Eye } from 'lucide-react';
import type { Assessment } from '@/types/assessment';
import { SECURITY_PROTOCOL_LABELS } from '@/types/assessment';
import RiskBadge from './RiskBadge';

interface AssessmentTableProps {
  assessments: Assessment[];
}

/**
 * Formats an ISO date string for display.
 */
function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AssessmentTable({ assessments }: AssessmentTableProps) {
  return (
    <>
      {/* Desktop table - hidden on mobile */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-card-border">
              <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Network Name</th>
              <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Protocol</th>
              <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Risk Level</th>
              <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Date</th>
              <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-card-border">
            {assessments.map((assessment) => (
              <tr key={assessment.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-foreground">
                  <span className="break-words">{assessment.ssid}</span>
                </td>
                <td className="px-4 py-3 text-sm text-muted">
                  {SECURITY_PROTOCOL_LABELS[assessment.securityProtocol]}
                </td>
                <td className="px-4 py-3">
                  <RiskBadge level={assessment.riskLevel} size="sm" />
                </td>
                <td className="px-4 py-3 text-sm text-muted">
                  {formatDate(assessment.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/reports/${assessment.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" />
                    View Report
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list - shown only on mobile */}
      <div className="md:hidden space-y-3">
        {assessments.map((assessment) => (
          <div
            key={assessment.id}
            className="rounded-lg border border-card-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground break-words">
                  {assessment.ssid}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {SECURITY_PROTOCOL_LABELS[assessment.securityProtocol]} · {formatDate(assessment.createdAt)}
                </p>
              </div>
              <RiskBadge level={assessment.riskLevel} size="sm" />
            </div>
            <div className="mt-3">
              <Link
                href={`/reports/${assessment.id}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
              >
                <Eye className="h-4 w-4" aria-hidden="true" />
                View Report
              </Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
