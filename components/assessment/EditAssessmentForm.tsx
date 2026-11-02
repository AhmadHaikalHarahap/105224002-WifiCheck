
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft } from 'lucide-react';

import type { Assessment } from '@/types/assessment';
import { updateAssessmentAction } from '@/app/actions/updateAssessmentAction';

interface EditAssessmentFormProps {
    assessment: Assessment;
}

export default function EditAssessmentForm({
    assessment,
}: EditAssessmentFormProps) {
    const router = useRouter();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState({
        ssid: assessment.ssid,
        securityProtocol: assessment.securityProtocol,
        passwordProtection: assessment.passwordProtection,
        wpsEnabled: assessment.wpsEnabled,
        firmwareStatus: assessment.firmwareStatus,
        notes: assessment.notes,
    });

    function handleChange(
        event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        setFieldErrors((previous) => ({
            ...previous,
            [name]: '',
        }));

        setError('');
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (isSubmitting) return;

        setIsSubmitting(true);
        setError('');
        setFieldErrors({});

        const submittedData = new FormData(event.currentTarget);
        submittedData.set('id', assessment.id);

        try {
            const result = await updateAssessmentAction(submittedData);

            if (!result.success) {
                setError(result.message);

                if (result.errors) {
                    const errors: Record<string, string> = {};

                    for (const [key, messages] of Object.entries(result.errors)) {
                        if (messages?.[0]) {
                            errors[key] = messages[0];
                        }
                    }

                    setFieldErrors(errors);
                }

                return;
            }

            router.push(`/reports/${assessment.id}`);
            router.refresh();
        } catch (err) {
            console.error('Gagal mengirim perubahan:', err);
            setError('Terjadi kesalahan. Silakan coba kembali.');
        } finally {
            setIsSubmitting(false);
        }
    }

    const inputClass =
        'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-100';

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-xl border border-card-border bg-card p-6 sm:p-8"
        >
            <div>
                <h2 className="text-lg font-semibold text-foreground">
                    Edit Wi-Fi Assessment
                </h2>
                <p className="mt-1 text-sm text-muted">
                    Ubah informasi jaringan dan simpan perubahan.
                </p>
            </div>

            {error && (
                <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                    {error}
                </div>
            )}

            <div className="space-y-2">
                <label htmlFor="ssid" className="block text-sm font-medium">
                    Network Name (SSID) *
                </label>
                <input
                    id="ssid"
                    name="ssid"
                    value={formData.ssid}
                    onChange={handleChange}
                    maxLength={32}
                    required
                    className={inputClass}
                />
                {fieldErrors.ssid && (
                    <p className="text-sm text-red-600">{fieldErrors.ssid}</p>
                )}
            </div>

            <div className="space-y-2">
                <label htmlFor="securityProtocol" className="block text-sm font-medium">
                    Security Protocol *
                </label>
                <select
                    id="securityProtocol"
                    name="securityProtocol"
                    value={formData.securityProtocol}
                    onChange={handleChange}
                    className={inputClass}
                >
                    <option value="open">Open</option>
                    <option value="wep">WEP</option>
                    <option value="wpa2">WPA2</option>
                    <option value="wpa3">WPA3</option>
                    <option value="unknown">Unknown</option>
                </select>
                {fieldErrors.securityProtocol && (
                    <p className="text-sm text-red-600">
                        {fieldErrors.securityProtocol}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <label htmlFor="passwordProtection" className="block text-sm font-medium">
                    Password Protection *
                </label>
                <select
                    id="passwordProtection"
                    name="passwordProtection"
                    value={formData.passwordProtection}
                    onChange={handleChange}
                    className={inputClass}
                >
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Disabled</option>
                    <option value="unknown">Unknown</option>
                </select>
                {fieldErrors.passwordProtection && (
                    <p className="text-sm text-red-600">
                        {fieldErrors.passwordProtection}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <label htmlFor="wpsEnabled" className="block text-sm font-medium">
                    WPS Status
                </label>
                <select
                    id="wpsEnabled"
                    name="wpsEnabled"
                    value={formData.wpsEnabled}
                    onChange={handleChange}
                    className={inputClass}
                >
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Disabled</option>
                    <option value="unknown">Unknown</option>
                </select>
                {fieldErrors.wpsEnabled && (
                    <p className="text-sm text-red-600">{fieldErrors.wpsEnabled}</p>
                )}
            </div>

            <div className="space-y-2">
                <label htmlFor="firmwareStatus" className="block text-sm font-medium">
                    Router Firmware Status
                </label>
                <select
                    id="firmwareStatus"
                    name="firmwareStatus"
                    value={formData.firmwareStatus}
                    onChange={handleChange}
                    className={inputClass}
                >
                    <option value="up-to-date">Up to date</option>
                    <option value="outdated">Outdated</option>
                    <option value="unknown">Unknown</option>
                </select>
                {fieldErrors.firmwareStatus && (
                    <p className="text-sm text-red-600">{fieldErrors.firmwareStatus}</p>
                )}
            </div>

            <div className="space-y-2">
                <label htmlFor="notes" className="block text-sm font-medium">
                    Optional Notes
                </label>
                <textarea
                    id="notes"
                    name="notes"
                    rows={4}
                    maxLength={250}
                    value={formData.notes}
                    onChange={handleChange}
                    className={inputClass}
                />
                <p className="text-right text-xs text-muted">
                    {formData.notes.length}/250 characters
                </p>
                {fieldErrors.notes && (
                    <p className="text-sm text-red-600">{fieldErrors.notes}</p>
                )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                    type="button"
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Cancel
                </button>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <Save className="h-4 w-4" />
                    {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
                </button>
            </div>
        </form>
    );
}
