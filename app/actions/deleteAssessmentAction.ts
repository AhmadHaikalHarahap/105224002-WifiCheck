
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

export async function deleteAssessmentAction(formData: FormData): Promise<void> {
    const id = formData.get('id');

    if (typeof id !== 'string' || !id) {
        console.error('ID assessment tidak valid.');
        return;
    }

    try {
        await prisma.assessment.delete({
            where: {
                id,
            },
        });

        revalidatePath('/history');
        revalidatePath(`/reports/${id}`);
    } catch (error) {
        console.error('Gagal menghapus assessment:', error);
    }
}
