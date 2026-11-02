
'use client';

import Link from 'next/link';
import { Eye, Trash2, Pencil } from 'lucide-react';

import type { Assessment } from '@/types/assessment';
import { SECURITY_PROTOCOL_LABELS } from '@/types/assessment';
import RiskBadge from './RiskBadge';
import { deleteAssessmentAction } from '@/app/actions/deleteAssessmentAction';

interface AssessmentTableProps {
  assessments: Assessment[];
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AssessmentTable({
  assessments,
}: AssessmentTableProps) {
  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-card-border">
              <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                Network Name
              </th>
              <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                Protocol
              </th>
              <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                Risk Level
              </th>
              <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                Date
              </th>
              <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-card-border">
            {assessments.map((assessment) => (
              <tr
                key={assessment.id}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-4 py-3 text-sm font-medium text-foreground">
                  <span className="break-words">
                    {assessment.ssid}
                  </span>
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

                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/reports/${assessment.id}`}
                      aria-label={`View report for ${assessment.ssid}`}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-cyan-700 hover:bg-cyan-50"
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" />
                      View
                    </Link>

                    <Link
                      href={`/reports/${assessment.id}/edit`}
                      aria-label={`Edit ${assessment.ssid}`}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      Edit
                    </Link>

                    <form
                      action={deleteAssessmentAction}
                      onSubmit={(event) => {
                        const confirmed = window.confirm(
                          `Apakah kamu yakin ingin menghapus assessment "${assessment.ssid}"?`,
                        );

                        if (!confirmed) {
                          event.preventDefault();
                        }
                      }}
                    >
                      <input
                        type="hidden"
                        name="id"
                        value={assessment.id}
                      />

                      <button
                        type="submit"
                        aria-label={`Delete ${assessment.ssid}`}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
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
                  {SECURITY_PROTOCOL_LABELS[assessment.securityProtocol]}
                  {' · '}
                  {formatDate(assessment.createdAt)}
                </p>
              </div>

              <RiskBadge level={assessment.riskLevel} size="sm" />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                href={`/reports/${assessment.id}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-700 hover:text-cyan-900"
              >
                <Eye className="h-4 w-4" aria-hidden="true" />
                View
              </Link>

              <Link
                href={`/reports/${assessment.id}/edit`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:text-amber-900"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Edit
              </Link>

              <form
                action={deleteAssessmentAction}
                onSubmit={(event) => {
                  const confirmed = window.confirm(
                    `Apakah kamu yakin ingin menghapus assessment "${assessment.ssid}"?`,
                  );

                  if (!confirmed) {
                    event.preventDefault();
                  }
                }}
              >
                <input
                  type="hidden"
                  name="id"
                  value={assessment.id}
                />

                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-700 hover:text-rose-900"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Delete
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
