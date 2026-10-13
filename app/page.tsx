'use client';

import Link from 'next/link';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Radio,
  PlusCircle,
  History,
  Info,
} from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import StatCard from '@/components/dashboard/StatCard';
import RecommendationCard from '@/components/dashboard/RecommendationCard';
import AssessmentTable from '@/components/assessment/AssessmentTable';
import EmptyState from '@/components/assessment/EmptyState';
import { useAssessments } from '@/components/providers/AssessmentProvider';

export default function DashboardPage() {
  const { assessments } = useAssessments();

  // Dynamically calculate metrics from the shared assessment collection
  const totalAssessments = assessments.length;
  const lowRiskCount = assessments.filter((a) => a.riskLevel === 'low').length;
  const mediumRiskCount = assessments.filter(
    (a) => a.riskLevel === 'medium'
  ).length;
  const highRiskCount = assessments.filter(
    (a) => a.riskLevel === 'high'
  ).length;

  // Most recent 5 assessments for the dashboard view
  const recentAssessments = assessments.slice(0, 5);

  return (
    <PageContainer
      title="WiFi Security Dashboard"
      description="Monitor and evaluate wireless network security postures through guided assessments."
    >
      <div className="space-y-8">
        {/* Welcome banner & Call to Actions */}
        <section
          aria-labelledby="welcome-heading"
          className="rounded-2xl border border-cyan-100 bg-gradient-to-r from-cyan-900 via-slate-900 to-cyan-950 p-6 sm:p-8 text-white shadow-sm"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-300 ring-1 ring-cyan-400/30">
                Milestone 1 · Educational Assessment
              </span>
              <h2
                id="welcome-heading"
                className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl text-white"
              >
                Understand Your Wi-Fi Security
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-300 sm:text-base">
                Evaluate your Wi-Fi router configurations without touching sensitive credentials. WiFi Check guides you through encryption standards, WPS risks, and firmware hygiene to uncover potential attack vectors.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/check"
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-sm transition-colors hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                <PlusCircle className="h-4 w-4" aria-hidden="true" />
                New Assessment
              </Link>
              <Link
                href="/history"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                <History className="h-4 w-4" aria-hidden="true" />
                View History
              </Link>
            </div>
          </div>
        </section>

        {/* Informational Disclaimer Notice */}
        <aside
          role="note"
          aria-label="Demonstration Notice"
          className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-muted shadow-2xs"
        >
          <div className="flex items-start gap-3">
            <Info className="h-4 w-4 text-cyan-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="leading-relaxed">
              <strong>Academic Demonstration Notice:</strong> Assessments reflect user-reported settings and predefined risk heuristics. This application does not inject packets, perform live hardware scanning, or crack passwords. All initial records are fictional mock evaluations.
            </p>
          </div>
        </aside>

        {/* Summary Metric Cards */}
        <section aria-labelledby="metrics-heading">
          <h2 id="metrics-heading" className="sr-only">
            Assessment Summary Metrics
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Radio}
              title="Total Assessments"
              value={totalAssessments}
              description="Evaluated networks in record"
              accentColor="bg-slate-100"
              iconColor="text-slate-700"
            />
            <StatCard
              icon={ShieldCheck}
              title="Low Risk"
              value={lowRiskCount}
              description="Compliant baseline configuration"
              accentColor="bg-emerald-50"
              iconColor="text-emerald-600"
            />
            <StatCard
              icon={ShieldAlert}
              title="Medium Risk"
              value={mediumRiskCount}
              description="Attention or hardening suggested"
              accentColor="bg-amber-50"
              iconColor="text-amber-600"
            />
            <StatCard
              icon={ShieldX}
              title="High Risk"
              value={highRiskCount}
              description="Immediate remediation required"
              accentColor="bg-rose-50"
              iconColor="text-rose-600"
            />
          </div>
        </section>

        {/* Recent Assessments Table */}
        <section
          aria-labelledby="recent-heading"
          className="rounded-xl border border-card-border bg-card p-5 sm:p-6 shadow-xs"
        >
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2
                id="recent-heading"
                className="text-lg font-bold text-foreground"
              >
                Recent Network Assessments
              </h2>
              <p className="text-xs text-muted">
                Showing the latest {recentAssessments.length} assessment records
              </p>
            </div>
            {assessments.length > 0 && (
              <Link
                href="/history"
                className="inline-flex items-center text-xs font-semibold text-cyan-700 hover:text-cyan-800 transition-colors"
              >
                View full history ({assessments.length}) &rarr;
              </Link>
            )}
          </div>

          {recentAssessments.length > 0 ? (
            <AssessmentTable assessments={recentAssessments} />
          ) : (
            <EmptyState
              title="No assessments recorded yet"
              description="Run your first manual Wi-Fi security check to review configuration vulnerabilities."
              actionLabel="Start First Assessment"
              actionHref="/check"
            />
          )}
        </section>

        {/* Security Best Practices / Recommendations Section */}
        <section aria-labelledby="recommendations-heading">
          <div className="mb-4">
            <h2
              id="recommendations-heading"
              className="text-lg font-bold text-foreground"
            >
              Essential Wi-Fi Security Practices
            </h2>
            <p className="text-xs text-muted">
              General guidelines for securing residential and educational Wi-Fi networks.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <RecommendationCard
              title="Adopt WPA3 Encryption"
              description="WPA3 implements Simultaneous Authentication of Equals (SAE) resistant to offline dictionary attacks. Prefer WPA3 or WPA2-AES."
            />
            <RecommendationCard
              title="Deactivate WPS (Wi-Fi Protected Setup)"
              description="WPS PIN authentication is prone to brute-force offline and online recovery within hours. Disable it in router administration."
            />
            <RecommendationCard
              title="Keep Firmware Updated"
              description="Outdated wireless access point firmware frequently harbors unpatched remote code execution vulnerabilities."
            />
            <RecommendationCard
              title="Separate Guest Networks"
              description="Isolate IoT devices and university guests on a segmented SSID to prevent lateral network reconnaissance."
            />
            <RecommendationCard
              title="Enforce Strong Passphrases"
              description="Use minimum 16-character passphrases with varied character classes to prevent precomputed dictionary recovery."
            />
            <RecommendationCard
              title="Disable Remote Router Admin"
              description="Ensure administrative management interfaces are accessible strictly through local wired or secure internal subnets."
            />
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
