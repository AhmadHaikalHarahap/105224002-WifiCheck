
import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import type { Assessment, RiskLevel } from '@/types/assessment';
import HistoryContent from '@/components/assessment/HistoryContent';
import {
  decryptAssessmentFields,
  decryptFindingFields,
} from '@/lib/assessment-crypto';

// Komponen utama halaman History
export default function HistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6">
          Memuat riwayat assessment...
        </div>
      }
    >
      <HistoryData />
    </Suspense>
  );
}

// Pengambilan data database dilakukan di dalam Suspense
async function HistoryData() {
  const databaseAssessments = await prisma.assessment.findMany({
    include: {
      findings: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const assessments: Assessment[] = databaseAssessments
    .map((item) => {
      let decrypted;

      try {
        decrypted = decryptAssessmentFields(item);
      } catch (error) {
        console.error('Gagal mendekripsi assessment id', item.id, error);
        return null;
      }

      const findings = item.findings
        .map((finding) => {
          try {
            const decryptedFinding = decryptFindingFields(finding);

            return {
              title: decryptedFinding.title,
              description: decryptedFinding.description,
              severity: finding.severity as RiskLevel,
            };
          } catch (error) {
            console.error('Gagal mendekripsi finding id', finding.id, error);
            return null;
          }
        })
        .filter(Boolean) as {
          title: string;
          description: string;
          severity: RiskLevel;
        }[];

      return {
        id: item.id,
        ssid: decrypted.ssid,
        securityProtocol: decrypted.securityProtocol,
        passwordProtection: decrypted.passwordProtection,
        wpsEnabled: decrypted.wpsEnabled,
        firmwareStatus: decrypted.firmwareStatus,
        notes: decrypted.notes,
        riskLevel: item.riskLevel as RiskLevel,
        summary: decrypted.summary,
        recommendations: decrypted.recommendations,
        findings,
        createdAt: item.createdAt.toISOString(),
      };
    })
    .filter(Boolean) as Assessment[];

  return <HistoryContent assessments={assessments} />;
}
