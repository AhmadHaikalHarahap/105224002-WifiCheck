
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const uuidSchema = z.string().uuid('ID tidak valid.');

const findingSchema = z.object({
    title: z.string()
        .trim()
        .min(1, 'Judul temuan wajib diisi.')
        .max(120, 'Judul maksimal 120 karakter.'),

    description: z.string()
        .trim()
        .min(1, 'Deskripsi temuan wajib diisi.')
        .max(2000, 'Deskripsi maksimal 2000 karakter.'),

    severity: z.enum(['low', 'medium', 'high'], {
        error: 'Tingkat risiko tidak valid.',
    }),
});

function validateFinding(formData: FormData) {
    return findingSchema.safeParse({
        title: formData.get('title'),
        description: formData.get('description'),
        severity: formData.get('severity'),
    });
}

export async function createFindingAction(formData: FormData) {
    const assessmentId = formData.get('assessmentId');

    const idValidation = uuidSchema.safeParse(assessmentId);

    if (!idValidation.success) {
        return {
            success: false,
            message: 'ID assessment tidak valid.',
        };
    }

    const validation = validateFinding(formData);

    if (!validation.success) {
        return {
            success: false,
            message: validation.error.issues[0]?.message ?? 'Data tidak valid.',
        };
    }

    try {
        const assessment = await prisma.assessment.findUnique({
            where: { id: idValidation.data },
            select: { id: true },
        });

        if (!assessment) {
            return {
                success: false,
                message: 'Assessment tidak ditemukan.',
            };
        }

        await prisma.finding.create({
            data: {
                assessmentId: assessment.id,
                title: validation.data.title,
                description: validation.data.description,
                severity: validation.data.severity,
                isManual: true,
            },
        });

        revalidatePath(`/reports/${assessment.id}`);
        revalidatePath('/history');

        return {
            success: true,
            message: 'Finding berhasil ditambahkan.',
        };
    } catch (error) {
        console.error('Gagal membuat finding:', error);

        return {
            success: false,
            message: 'Gagal menambahkan finding.',
        };
    }
}

export async function updateFindingAction(formData: FormData) {
    const id = formData.get('id');
    const assessmentId = formData.get('assessmentId');

    const idValidation = uuidSchema.safeParse(id);
    const assessmentValidation = uuidSchema.safeParse(assessmentId);

    if (!idValidation.success || !assessmentValidation.success) {
        return {
            success: false,
            message: 'ID finding atau assessment tidak valid.',
        };
    }

    const validation = validateFinding(formData);

    if (!validation.success) {
        return {
            success: false,
            message: validation.error.issues[0]?.message ?? 'Data tidak valid.',
        };
    }

    try {
        const result = await prisma.finding.updateMany({
            where: {
                id: idValidation.data,
                assessmentId: assessmentValidation.data,
                isManual: true,
            },
            data: {
                title: validation.data.title,
                description: validation.data.description,
                severity: validation.data.severity,
            },
        });

        if (result.count === 0) {
            return {
                success: false,
                message: 'Finding tidak ditemukan atau bukan temuan manual.',
            };
        }

        revalidatePath(`/reports/${assessmentValidation.data}`);

        return {
            success: true,
            message: 'Finding berhasil diperbarui.',
        };
    } catch (error) {
        console.error('Gagal memperbarui finding:', error);

        return {
            success: false,
            message: 'Gagal memperbarui finding.',
        };
    }
}

export async function deleteFindingAction(formData: FormData) {
    const id = formData.get('id');
    const assessmentId = formData.get('assessmentId');

    const idValidation = uuidSchema.safeParse(id);
    const assessmentValidation = uuidSchema.safeParse(assessmentId);

    if (!idValidation.success || !assessmentValidation.success) {
        return {
            success: false,
            message: 'ID finding atau assessment tidak valid.',
        };
    }

    try {
        const result = await prisma.finding.deleteMany({
            where: {
                id: idValidation.data,
                assessmentId: assessmentValidation.data,
                isManual: true,
            },
        });

        if (result.count === 0) {
            return {
                success: false,
                message: 'Finding tidak ditemukan atau bukan temuan manual.',
            };
        }

        revalidatePath(`/reports/${assessmentValidation.data}`);

        return {
            success: true,
            message: 'Finding berhasil dihapus.',
        };
    } catch (error) {
        console.error('Gagal menghapus finding:', error);

        return {
            success: false,
            message: 'Gagal menghapus finding.',
        };
    }
}
