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

export async function updateAssessmentAction(formData: FormData) {
    const id = formData.get('id');

    // Validasi ID assessment dengan format UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (typeof id !== 'string' || !uuidRegex.test(id)) {
        return {
            success: false,
            message: 'ID assessment tidak valid.',
        };
    }

    // Mengambil data dari form
    const rawData = {
        ssid: formData.get('ssid'),
        securityProtocol: formData.get('securityProtocol'),
        passwordProtection: formData.get('passwordProtection'),
        wpsEnabled: formData.get('wpsEnabled'),
        firmwareStatus: formData.get('firmwareStatus'),
        notes: formData.get('notes') ?? '',
    };

    // Validasi menggunakan Zod
    const validation = assessmentSchema.safeParse(rawData);

    if (!validation.success) {
        return {
            success: false,
            message: 'Data tidak valid. Periksa kembali isian form.',
            errors: validation.error.flatten().fieldErrors,
        };
    }

    try {
        const input = validation.data;

        // Menjalankan ulang analisis keamanan
        const result = performAssessment(input);

        // Enkripsi field Assessment menggunakan ID yang sudah ada
        const encryptedAssessment = encryptAssessmentFields(id, {
            ssid: input.ssid,
            securityProtocol: input.securityProtocol,
            passwordProtection: input.passwordProtection,
            wpsEnabled: input.wpsEnabled,
            firmwareStatus: input.firmwareStatus,
            notes: input.notes,
            summary: result.summary,
            recommendations: result.recommendations,
        });

        // Enkripsi temuan otomatis baru
        const encryptedFindings = result.findings.map((finding) => {
            const findingId = randomUUID();
            const encryptedFinding = encryptFindingFields(id, findingId, {
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
                isManual: false,
            };
        });

        // Memperbarui assessment di database (dual-write: plaintext + *_enc)
        await prisma.assessment.update({
            where: { id },
            data: {
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

                recommendations:
                    result.recommendations as Prisma.InputJsonValue,
                recommendations_enc:
                    encryptedAssessment.recommendations_enc as unknown as Prisma.InputJsonValue,

                // Memperbarui temuan otomatis saja
                // Temuan manual tidak ikut dihapus
                findings: {
                    deleteMany: {
                        isManual: false,
                    },

                    create: encryptedFindings,
                },
            },
        });

        // Memperbarui cache halaman
        revalidatePath('/history');
        revalidatePath(`/reports/${id}`);
        revalidatePath(`/reports/${id}/edit`);

        return {
            success: true,
            message: 'Assessment berhasil diperbarui.',
            id,
        };
    } catch (error) {
        console.error('Gagal memperbarui assessment:', error);

        return {
            success: false,
            message: 'Gagal memperbarui assessment. Silakan coba lagi.',
        };
    }
}
