'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { assessmentSchema } from '@/lib/skema';
import { performAssessment } from '@/lib/assessment-rules';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/lib/generated/prisma/client';
import {
    encryptAssessmentFields,
    encryptFindingFields,
} from '@/lib/assessment-crypto';

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

        // Buat ID Assessment sebelum enkripsi untuk membangun AAD yang mengikat
        const assessmentId = randomUUID();

        // Enkripsi field Assessment
        const encryptedAssessment = encryptAssessmentFields(assessmentId, {
            ssid: input.ssid,
            securityProtocol: input.securityProtocol,
            passwordProtection: input.passwordProtection,
            wpsEnabled: input.wpsEnabled,
            firmwareStatus: input.firmwareStatus,
            notes: input.notes,
            summary: result.summary,
            recommendations: result.recommendations,
        });

        // Enkripsi temuan otomatis
        const encryptedFindings = result.findings.map((finding) => {
            const findingId = randomUUID();
            const encryptedFinding = encryptFindingFields(assessmentId, findingId, {
                title: finding.title,
                description: finding.description,
            });

            return {
                id: findingId,
                title: finding.title,
                title_enc: encryptedFinding.title_enc as unknown as Prisma.InputJsonValue,
                description: finding.description,
                description_enc: encryptedFinding.description_enc as unknown as Prisma.InputJsonValue,
                severity: finding.severity,
            };
        });

        // Simpan assessment dan findings sekaligus (dual-write: plaintext + *_enc)
        const savedAssessment = await prisma.assessment.create({
            data: {
                id: assessmentId,
                ssid: input.ssid,
                ssid_enc: encryptedAssessment.ssid_enc as unknown as Prisma.InputJsonValue,
                securityProtocol: input.securityProtocol,
                securityProtocol_enc: encryptedAssessment.securityProtocol_enc as unknown as Prisma.InputJsonValue,
                passwordProtection: input.passwordProtection,
                passwordProtection_enc: encryptedAssessment.passwordProtection_enc as unknown as Prisma.InputJsonValue,
                wpsEnabled: input.wpsEnabled,
                wpsEnabled_enc: encryptedAssessment.wpsEnabled_enc as unknown as Prisma.InputJsonValue,
                firmwareStatus: input.firmwareStatus,
                firmwareStatus_enc: encryptedAssessment.firmwareStatus_enc as unknown as Prisma.InputJsonValue,
                notes: input.notes,
                notes_enc: encryptedAssessment.notes_enc as unknown as Prisma.InputJsonValue,
                riskLevel: result.riskLevel,
                summary: result.summary,
                summary_enc: encryptedAssessment.summary_enc as unknown as Prisma.InputJsonValue,
                recommendations: result.recommendations as Prisma.InputJsonValue,
                recommendations_enc: encryptedAssessment.recommendations_enc as unknown as Prisma.InputJsonValue,
                findings: {
                    create: encryptedFindings,
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
