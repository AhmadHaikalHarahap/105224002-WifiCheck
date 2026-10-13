'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Hash,
  PlusCircle,
  Router,
  KeyRound,
  Radio,
  Cpu,
  FileText,
} from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import RiskBadge from '@/components/assessment/RiskBadge';
import EmptyState from '@/components/assessment/EmptyState';
import { useAssessments } from '@/components/providers/AssessmentProvider';
import {
  SECURITY_PROTOCOL_LABELS,
  PROTECTION_STATUS_LABELS,
  FIRMWARE_STATUS_LABELS,
} from '@/types/assessment';

interface ReportDetailClientProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ReportDetailClient({
  params,
}: ReportDetailClientProps) {
  const { id } = React.use(params);
  const { getAssessment } = useAssessments();
  const assessment = getAssessment(id);

  if (!assessment) {
    return (
      <PageContainer
        title="Report Not Found"
        description="The requested assessment record could not be located."
      >
        <div className="py-12">
          <EmptyState
            title="Assessment Report Not Found"
            description={`No assessment record exists matching ID "${id}". It may have been generated in a previous session or the URL may be incorrect.`}
            actionLabel="Return to Assessment History"
            actionHref="/history"
          />
        </div>
      </PageContainer>
    );
  }

  const formattedDate = new Date(assessment.createdAt).toLocaleDateString(
    'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  );

  return (
    <PageContainer
      title={`Report: ${assessment.ssid}`}
      description="Detailed technical security posture breakdown and remediation recommendations."
    >
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Top Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/history"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Assessment History
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/check"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <PlusCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Assess Another Network
            </Link>
          </div>
        </div>

        {/* Hero Card: Network Overview & Risk Status */}
        <div className="rounded-2xl border border-card-border bg-card p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-muted">
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Assessed on {formattedDate}</span>
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground break-words">
                {assessment.ssid}
              </h1>
              <p className="mt-2 text-sm text-muted">
                Reference ID:{' '}
                <code className="font-mono text-xs text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                  {assessment.id}
                </code>
              </p>
            </div>
            <div>
              <RiskBadge level={assessment.riskLevel} size="lg" />
            </div>
          </div>

          {/* Assessment Summary Paragraph */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm leading-relaxed text-slate-800">
            <h2 className="font-semibold text-slate-950 mb-1">Executive Summary</h2>
            <p>{assessment.summary}</p>
          </div>
        </div>

        {/* Technical Configuration Grid */}
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-xs">
          <h2 className="text-base font-bold text-foreground mb-4">
            Network Configuration Attributes
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Protocol */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted">
                <Radio className="h-4 w-4 text-cyan-700" aria-hidden="true" />
                <span>Security Protocol</span>
              </div>
              <p className="mt-2 text-base font-semibold text-foreground">
                {SECURITY_PROTOCOL_LABELS[assessment.securityProtocol]}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {assessment.securityProtocol === 'wpa3'
                  ? 'Latest standard'
                  : assessment.securityProtocol === 'wpa2'
                  ? 'Acceptable encryption'
                  : 'Vulnerable standard'}
              </p>
            </div>

            {/* Password Protection */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted">
                <KeyRound className="h-4 w-4 text-cyan-700" aria-hidden="true" />
                <span>Password Required</span>
              </div>
              <p className="mt-2 text-base font-semibold text-foreground">
                {PROTECTION_STATUS_LABELS[assessment.passwordProtection]}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {assessment.passwordProtection === 'enabled'
                  ? 'Access restricted'
                  : 'Open access danger'}
              </p>
            </div>

            {/* WPS */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted">
                <Router className="h-4 w-4 text-cyan-700" aria-hidden="true" />
                <span>WPS Status</span>
              </div>
              <p className="mt-2 text-base font-semibold text-foreground">
                {PROTECTION_STATUS_LABELS[assessment.wpsEnabled]}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {assessment.wpsEnabled === 'disabled'
                  ? 'Hardened against PIN attacks'
                  : 'Potential PIN exploit vector'}
              </p>
            </div>

            {/* Firmware */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted">
                <Cpu className="h-4 w-4 text-cyan-700" aria-hidden="true" />
                <span>Firmware Status</span>
              </div>
              <p className="mt-2 text-base font-semibold text-foreground">
                {FIRMWARE_STATUS_LABELS[assessment.firmwareStatus]}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {assessment.firmwareStatus === 'up-to-date'
                  ? 'Patches applied'
                  : 'Known CVE exposures likely'}
              </p>
            </div>
          </div>

          {/* Notes section if present */}
          {assessment.notes && (
            <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted">
                <FileText className="h-4 w-4 text-slate-500" aria-hidden="true" />
                <span>User Notes</span>
              </div>
              <p className="mt-1.5 text-sm text-slate-700">{assessment.notes}</p>
            </div>
          )}
        </div>

        {/* Detailed Findings Section */}
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-xs">
          <h2 className="text-base font-bold text-foreground mb-4">
            Security Findings ({assessment.findings.length})
          </h2>
          <div className="space-y-3">
            {assessment.findings.map((finding, idx) => {
              const isHigh = finding.severity === 'high';
              const isMed = finding.severity === 'medium';

              return (
                <div
                  key={idx}
                  className={`flex items-start gap-3 rounded-lg border p-4 ${
                    isHigh
                      ? 'border-rose-200 bg-rose-50/50 text-rose-950'
                      : isMed
                      ? 'border-amber-200 bg-amber-50/50 text-amber-950'
                      : 'border-emerald-200 bg-emerald-50/40 text-emerald-950'
                  }`}
                >
                  {isHigh ? (
                    <XCircle
                      className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                  ) : isMed ? (
                    <AlertTriangle
                      className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                  ) : (
                    <CheckCircle2
                      className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold">{finding.title}</h3>
                      <span
                        className={`text-2xs uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                          isHigh
                            ? 'bg-rose-100 text-rose-700'
                            : isMed
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {finding.severity}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed opacity-90">
                      {finding.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actionable Recommendations Section */}
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-xs">
          <h2 className="text-base font-bold text-foreground mb-4">
            Actionable Remediation Recommendations
          </h2>
          <ol className="space-y-3 list-decimal list-inside">
            {assessment.recommendations.map((rec, idx) => (
              <li
                key={idx}
                className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 text-sm text-slate-800 leading-relaxed"
              >
                <span className="font-medium text-slate-950">{rec}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Cryptography & Future Milestone Scope Notice */}
        <aside
          role="region"
          aria-label="Cryptography and Architecture Notes"
          className="rounded-xl border border-cyan-200 bg-cyan-50/60 p-5 text-xs text-cyan-950"
        >
          <div className="flex items-start gap-3">
            <Hash
              className="h-5 w-5 text-cyan-700 flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <h3 className="font-bold text-sm text-cyan-950">
                Milestone 1 Architecture &amp; Future Cryptography Scope
              </h3>
              <p className="mt-1.5 leading-relaxed text-cyan-900">
                This assessment was produced purely via transparent client-side
                rule evaluation. In subsequent milestones (Milestones 2 &amp; 3),
                canonicalized configuration structures will generate verifiable
                cryptographic fingerprints (such as SHA-256 integrity digests)
                and connect to server-side threat validation engines.
              </p>
            </div>
          </div>
        </aside>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-slate-200">
          <Link
            href="/history"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Return to History
          </Link>
          <Link
            href="/check"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-700 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-800 transition-colors"
          >
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            Start New Assessment
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
