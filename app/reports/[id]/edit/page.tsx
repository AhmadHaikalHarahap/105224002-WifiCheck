
import { Suspense } from 'react';
import { notFound } from 'next/navigation';

import { prisma } from '@/lib/prisma';
import type {
    Assessment,
    RiskLevel,
    SecurityProtocol,
    ProtectionStatus,
    FirmwareStatus,
} from '@/types/assessment';

import EditAssessmentForm from '@/components/assessment/EditAssessmentForm';

interface EditPageProps {
    params: Promise<{ id: string }>;
}

export default function EditAssessmentPage({ params }: EditPageProps) {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center">
                    <p className="text-sm text-slate-600">Loading assessment...</p>
                </div>
            }
        >
            <EditAssessmentData params={params} />
        </Suspense>
    );
}

async function EditAssessmentData({ params }: EditPageProps) {
    const { id } = await params;

    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(id)) {
        notFound();
    }

    const item = await prisma.assessment.findUnique({
        where: { id },
        include: { findings: true },
    });

    if (!item) {
        notFound();
    }

    const assessment: Assessment = {
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
    };

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-10">
            <div className="mx-auto max-w-3xl space-y-6">
                <div>
                    <p className="text-sm font-medium text-cyan-700">
                        WiFi Check / Assessment
                    </p>
                    <h1 className="mt-2 text-2xl font-bold text-slate-900">
                        Edit Assessment
                    </h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Perbarui informasi konfigurasi keamanan jaringan Wi-Fi.
                    </p>
                </div>

                <EditAssessmentForm assessment={assessment} />
            </div>
        </main>
    );
}
