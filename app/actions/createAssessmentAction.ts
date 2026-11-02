
'use server';

import { revalidatePath } from 'next/cache';
import { assessmentSchema } from '@/lib/skema';
import { performAssessment } from '@/lib/assessment-rules';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/lib/generated/prisma/client';

export interface CreateAssessmentState {
    success: boolean;
    id?: string;
    errors?: {
        ssid?: string[];
        securityProtocol?: string[];
        passwordProtection?: string[];
        wpsEnabled?: string[];
        firmwareStatus?: string[];
        notes?: string[];
        _form?: string[];
    };
}

export async function createAssessmentAction(
    formData: FormData,
): Promise<CreateAssessmentState> {
    // Ambil data mentah dari form
    const rawData = {
        ssid: formData.get('ssid'),
        securityProtocol: formData.get('securityProtocol'),
        passwordProtection: formData.get('passwordProtection'),
        wpsEnabled: formData.get('wpsEnabled'),
        firmwareStatus: formData.get('firmwareStatus'),
        notes: formData.get('notes') ?? '',
    };

    // Validasi ulang di server menggunakan Zod
    const validation = assessmentSchema.safeParse(rawData);

    if (!validation.success) {
        const fieldErrors = validation.error.flatten().fieldErrors;

        return {
            success: false,
            errors: {
                ssid: fieldErrors.ssid,
                securityProtocol: fieldErrors.securityProtocol,
                passwordProtection: fieldErrors.passwordProtection,
                wpsEnabled: fieldErrors.wpsEnabled,
                firmwareStatus: fieldErrors.firmwareStatus,
                notes: fieldErrors.notes,
            },
        };
    }

    try {
        const input = validation.data;

        // Jalankan aturan penilaian keamanan WiFi
        const result = performAssessment(input);

        // Simpan assessment dan findings sekaligus
        const savedAssessment = await prisma.assessment.create({
            data: {
                ssid: input.ssid,
                securityProtocol: input.securityProtocol,
                passwordProtection: input.passwordProtection,
                wpsEnabled: input.wpsEnabled,
                firmwareStatus: input.firmwareStatus,
                notes: input.notes,
                riskLevel: result.riskLevel,
                summary: result.summary,
                recommendations: result.recommendations as Prisma.InputJsonValue,
                findings: {
                    create: result.findings.map((finding) => ({
                        title: finding.title,
                        description: finding.description,
                        severity: finding.severity,
                    })),
                },
            },
            select: {
                id: true,
            },
        });

        revalidatePath('/history');

        return {
            success: true,
            id: savedAssessment.id,
        };
    } catch (error) {
        console.error('Gagal menyimpan assessment:', error);

        return {
            success: false,
            errors: {
                _form: ['Terjadi kesalahan saat menyimpan assessment. Silakan coba lagi.'],
            },
        };
    }
}
