import { Suspense } from 'react';
import { notFound } from 'next/navigation';

import { prisma } from '@/lib/prisma';
import type { Assessment, RiskLevel } from '@/types/assessment';
import {
  decryptAssessmentFields,
  decryptFindingFields,
} from '@/lib/assessment-crypto';

import ReportDetailClient from './ReportDetailClient';
import FindingManager from '@/components/assessment/FindingManager';

interface ReportPageProps {
  params: Promise<{ id: string }>;
}

export default function ReportDetailPage({ params }: ReportPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <p className="text-sm text-slate-600">
            Loading assessment report...
          </p>
        </div>
      }
    >
      <ReportDetailData params={params} />
    </Suspense>
  );
}

async function ReportDetailData({ params }: ReportPageProps) {
  const { id } = await params;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(id)) {
    notFound();
  }

  const databaseAssessment = await prisma.assessment.findUnique({
    where: { id },
    include: { findings: true },
  });

  if (!databaseAssessment) {
    notFound();
  }

  let decryptedAssessment: ReturnType<typeof decryptAssessmentFields>;
  try {
    decryptedAssessment = decryptAssessmentFields(databaseAssessment);
  } catch (error) {
    console.error('Gagal mendekripsi assessment:', error);
    notFound();
    return; // unreachable, but satisfies TypeScript
  }

  const decryptedFindings = databaseAssessment.findings
    .map((finding) => {
      const decrypted = decryptFindingFields(finding);
      return {
        id: finding.id,
        title: decrypted.title,
        description: decrypted.description,
        severity: finding.severity,
        isManual: finding.isManual,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));

  const assessment: Assessment = {
    id: databaseAssessment.id,
    ssid: decryptedAssessment.ssid,
    securityProtocol: decryptedAssessment.securityProtocol,
    passwordProtection: decryptedAssessment.passwordProtection,
    wpsEnabled: decryptedAssessment.wpsEnabled,
    firmwareStatus: decryptedAssessment.firmwareStatus,
    notes: decryptedAssessment.notes,
    riskLevel: databaseAssessment.riskLevel as RiskLevel,
    summary: decryptedAssessment.summary,
    recommendations: decryptedAssessment.recommendations,
    findings: decryptedFindings.map((finding) => ({
      title: finding.title,
      description: finding.description,
      severity: finding.severity as RiskLevel,
    })),
    createdAt: databaseAssessment.createdAt.toISOString(),
  };

  return (
    <>
      <ReportDetailClient assessment={assessment} />

      <div className="bg-slate-50 px-4 pb-12">
        <div className="mx-auto max-w-4xl">
          <FindingManager
            assessmentId={databaseAssessment.id}
            findings={decryptedFindings}
          />
        </div>
      </div>
    </>
  );
}
