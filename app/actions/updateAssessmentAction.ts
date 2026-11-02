
'use server';

import { revalidatePath } from 'next/cache';
import { assessmentSchema } from '@/lib/skema';
import { performAssessment } from '@/lib/assessment-rules';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/lib/generated/prisma/client';

export async function updateAssessmentAction(formData: FormData) {
    const id = formData.get('id');

    // Validasi ID assessment
    if (typeof id !== 'string' || !id) {
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

        // Memperbarui assessment di database
        await prisma.assessment.update({
            where: { id },
            data: {
                ssid: input.ssid,
                securityProtocol: input.securityProtocol,
                passwordProtection: input.passwordProtection,
                wpsEnabled: input.wpsEnabled,
                firmwareStatus: input.firmwareStatus,
                notes: input.notes,

                riskLevel: result.riskLevel,
                summary: result.summary,

                recommendations:
                    result.recommendations as Prisma.InputJsonValue,

                // Memperbarui temuan otomatis saja
                // Temuan manual tidak ikut dihapus
                findings: {
                    deleteMany: {
                        isManual: false,
                    },

                    create: result.findings.map((finding) => ({
                        title: finding.title,
                        description: finding.description,
                        severity: finding.severity,
                        isManual: false,
                    })),
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
