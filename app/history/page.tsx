
import { prisma } from '@/lib/prisma';
import type {
  Assessment,
  RiskLevel,
  SecurityProtocol,
  ProtectionStatus,
  FirmwareStatus,
} from '@/types/assessment';
import HistoryContent from '@/components/assessment/HistoryContent';

export default async function HistoryPage() {
  const databaseAssessments = await prisma.assessment.findMany({
    include: {
      findings: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const assessments: Assessment[] = databaseAssessments.map((item) => ({
    id: item.id,
    ssid: item.ssid,
    securityProtocol: item.securityProtocol as SecurityProtocol,
    passwordProtection: item.passwordProtection as ProtectionStatus,
    wpsEnabled: item.wpsEnabled as ProtectionStatus,
    firmwareStatus: item.firmwareStatus as FirmwareStatus,
    notes: item.notes,
    riskLevel: item.riskLevel as RiskLevel,
    summary: item.summary,
    recommendations: Array.isArray(item.recommendations)
      ? item.recommendations.filter(
        (value): value is string => typeof value === 'string',
      )
      : [],
    findings: item.findings.map((finding) => ({
      title: finding.title,
      description: finding.description,
      severity: finding.severity as RiskLevel,
    })),
    createdAt: item.createdAt.toISOString(),
  }));

  return <HistoryContent assessments={assessments} />;
}
