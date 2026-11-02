
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';

import {
    createFindingAction,
    updateFindingAction,
    deleteFindingAction,
} from '@/app/actions/findingActions';

type Severity = 'low' | 'medium' | 'high';

interface FindingItem {
    id: string;
    title: string;
    description: string;
    severity: string;
    isManual: boolean;
}

interface FindingManagerProps {
    assessmentId: string;
    findings: FindingItem[];
}

const emptyForm = {
    title: '',
    description: '',
    severity: 'medium' as Severity,
};

const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-100';

export default function FindingManager({
    assessmentId,
    findings,
}: FindingManagerProps) {
    const router = useRouter();

    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const manualFindings = findings.filter((item) => item.isManual);

    function handleChange(
        event: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
    ) {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));

        setError('');
        setMessage('');
    }

    function startEdit(finding: FindingItem) {
        setEditingId(finding.id);

        setForm({
            title: finding.title,
            description: finding.description,
            severity: finding.severity as Severity,
        });

        setError('');
        setMessage('');
    }

    function cancelEdit() {
        setEditingId(null);
        setForm(emptyForm);
        setError('');
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (isSubmitting) return;

        setIsSubmitting(true);
        setError('');
        setMessage('');

        const formData = new FormData();
        formData.set('assessmentId', assessmentId);
        formData.set('title', form.title);
        formData.set('description', form.description);
        formData.set('severity', form.severity);

        try {
            const result = editingId
                ? await updateFindingAction(
                    (() => {
                        formData.set('id', editingId);
                        return formData;
                    })(),
                )
                : await createFindingAction(formData);

            if (!result.success) {
                setError(result.message);
                return;
            }

            setMessage(result.message);
            setForm(emptyForm);
            setEditingId(null);
            router.refresh();
        } catch (err) {
            console.error('Gagal menyimpan finding:', err);
            setError('Terjadi kesalahan. Silakan coba kembali.');
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleDelete(findingId: string) {
        const confirmed = window.confirm(
            'Apakah kamu yakin ingin menghapus finding ini?',
        );

        if (!confirmed || isSubmitting) return;

        setIsSubmitting(true);
        setError('');
        setMessage('');

        const formData = new FormData();
        formData.set('id', findingId);
        formData.set('assessmentId', assessmentId);

        try {
            const result = await deleteFindingAction(formData);

            if (!result.success) {
                setError(result.message);
                return;
            }

            setMessage(result.message);

            if (editingId === findingId) {
                cancelEdit();
            }

            router.refresh();
        } catch (err) {
            console.error('Gagal menghapus finding:', err);
            setError('Terjadi kesalahan saat menghapus finding.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <section className="rounded-xl border border-card-border bg-card p-6 shadow-xs">
            <div className="mb-5">
                <h2 className="text-base font-bold text-foreground">
                    Manage Manual Findings
                </h2>
                <p className="mt-1 text-sm text-muted">
                    Tambahkan dan kelola temuan keamanan tambahan secara manual.
                    Temuan otomatis dari sistem tidak dapat diubah di bagian ini.
                </p>
            </div>

            {message && (
                <div
                    role="status"
                    className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
                >
                    {message}
                </div>
            )}

            {error && (
                <div
                    role="alert"
                    className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                    {error}
                </div>
            )}

            <div className="mb-6 space-y-3">
                {manualFindings.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                        Belum ada temuan manual untuk assessment ini.
                    </p>
                ) : (
                    manualFindings.map((finding) => (
                        <div
                            key={finding.id}
                            className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-start sm:justify-between"
                        >
                            <div className="min-w-0 flex-1">
                                <h3 className="text-sm font-semibold text-slate-900">
                                    {finding.title}
                                </h3>

                                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                                    {finding.description}
                                </p>

                                <span className="mt-2 inline-block rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase text-slate-600">
                                    {finding.severity}
                                </span>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => startEdit(finding)}
                                    disabled={isSubmitting}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                    Edit
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleDelete(finding.id)}
                                    disabled={isSubmitting}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="border-t border-slate-200 pt-5">
                <h3 className="mb-4 text-sm font-semibold text-slate-900">
                    {editingId ? 'Edit Manual Finding' : 'Add New Finding'}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="finding-title"
                            className="mb-1.5 block text-sm font-medium text-slate-700"
                        >
                            Finding Title
                        </label>

                        <input
                            id="finding-title"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            maxLength={120}
                            required
                            className={inputClass}
                            placeholder="Contoh: Router menggunakan password default"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="finding-description"
                            className="mb-1.5 block text-sm font-medium text-slate-700"
                        >
                            Description
                        </label>

                        <textarea
                            id="finding-description"
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            rows={3}
                            maxLength={2000}
                            required
                            className={inputClass}
                            placeholder="Jelaskan temuan keamanan..."
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="finding-severity"
                            className="mb-1.5 block text-sm font-medium text-slate-700"
                        >
                            Severity
                        </label>

                        <select
                            id="finding-severity"
                            name="severity"
                            value={form.severity}
                            onChange={handleChange}
                            className={inputClass}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {editingId ? (
                                <Save className="h-4 w-4" />
                            ) : (
                                <Plus className="h-4 w-4" />
                            )}

                            {isSubmitting
                                ? 'Processing...'
                                : editingId
                                    ? 'Save Changes'
                                    : 'Add Finding'}
                        </button>

                        {editingId && (
                            <button
                                type="button"
                                onClick={cancelEdit}
                                disabled={isSubmitting}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                <X className="h-4 w-4" />
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </section>
    );
}
