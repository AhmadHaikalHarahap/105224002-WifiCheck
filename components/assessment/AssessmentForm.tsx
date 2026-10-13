'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import type {
  Assessment,
  AssessmentInput,
  FirmwareStatus,
  ProtectionStatus,
  SecurityProtocol,
  ValidationErrors,
} from '@/types/assessment';
import {
  SECURITY_PROTOCOL_LABELS,
  PROTECTION_STATUS_LABELS,
  FIRMWARE_STATUS_LABELS,
} from '@/types/assessment';
import { validateAssessmentInput, hasErrors } from '@/lib/validation';
import { performAssessment } from '@/lib/assessment-rules';
import { useAssessments } from '@/components/providers/AssessmentProvider';
import FormField from './FormField';

interface AssessmentFormProps {
  /** Optional callback fired when assessment is successfully completed */
  onSuccess?: (assessment: Assessment) => void;
}

const initialFormState: AssessmentInput = {
  ssid: '',
  securityProtocol: 'wpa2',
  passwordProtection: 'enabled',
  wpsEnabled: 'disabled',
  firmwareStatus: 'up-to-date',
  notes: '',
};

export default function AssessmentForm({ onSuccess }: AssessmentFormProps) {
  const router = useRouter();
  const { addAssessment } = useAssessments();

  const [formData, setFormData] = useState<AssessmentInput>(initialFormState);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    field: keyof AssessmentInput,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear field-specific error upon typing
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Prevent duplicate submission
    if (isSubmitting) return;

    // Validate inputs
    const validationErrors = validateAssessmentInput(formData);
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      // Focus on the first invalid field
      if (validationErrors.ssid) {
        document.getElementById('ssid')?.focus();
      } else if (validationErrors.securityProtocol) {
        document.getElementById('securityProtocol')?.focus();
      }
      return;
    }

    setIsSubmitting(true);

    try {
      // Evaluate risk through transparent rule engine
      const assessmentResult = performAssessment(formData);

      // Create full assessment record
      const newAssessment: Assessment = {
        id: `assessment-${Date.now()}`,
        ...formData,
        ssid: formData.ssid.trim(),
        ...assessmentResult,
        createdAt: new Date().toISOString(),
      };

      // Save to shared in-memory state
      addAssessment(newAssessment);

      if (onSuccess) {
        onSuccess(newAssessment);
      } else {
        // Automatically route to the generated report
        router.push(`/reports/${newAssessment.id}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Notice about password privacy */}
      <div
        className="rounded-xl border border-sky-200 bg-sky-50/70 p-4 text-sky-900 shadow-xs"
        role="region"
        aria-label="Privacy notice"
      >
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-sky-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-sm">
            <strong className="font-semibold text-sky-950">Privacy &amp; Safety Notice:</strong>
            <p className="mt-1 leading-relaxed text-sky-800">
              WiFi Check only assesses security parameters you describe manually. <strong>Never enter your actual Wi-Fi password or private network credentials</strong> anywhere on this form.
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="rounded-xl border border-card-border bg-card p-6 sm:p-8 shadow-xs"
        aria-label="Wi-Fi Security Assessment Form"
      >
        <div className="space-y-6">
          {/* A. SSID */}
          <FormField
            id="ssid"
            label="Network Name (SSID)"
            required
            description="The broadcast name of the wireless network (max 32 characters)."
            error={errors.ssid}
          >
            <input
              type="text"
              id="ssid"
              name="ssid"
              value={formData.ssid}
              onChange={(e) => handleInputChange('ssid', e.target.value)}
              maxLength={32}
              placeholder="e.g. MyHome-WiFi"
              aria-required="true"
              aria-invalid={Boolean(errors.ssid)}
              aria-describedby={
                errors.ssid
                  ? 'ssid-error ssid-description'
                  : 'ssid-description'
              }
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                errors.ssid
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                  : 'border-slate-300 focus:border-cyan-600 focus:ring-cyan-100'
              }`}
            />
          </FormField>

          {/* B. Security Protocol */}
          <FormField
            id="securityProtocol"
            label="Security Protocol"
            required
            description="The encryption standard configured on your Wi-Fi router."
            error={errors.securityProtocol}
          >
            <select
              id="securityProtocol"
              name="securityProtocol"
              value={formData.securityProtocol}
              onChange={(e) =>
                handleInputChange(
                  'securityProtocol',
                  e.target.value as SecurityProtocol
                )
              }
              aria-required="true"
              aria-invalid={Boolean(errors.securityProtocol)}
              aria-describedby={
                errors.securityProtocol
                  ? 'securityProtocol-error securityProtocol-description'
                  : 'securityProtocol-description'
              }
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm bg-white transition-colors focus:outline-none focus:ring-2 ${
                errors.securityProtocol
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                  : 'border-slate-300 focus:border-cyan-600 focus:ring-cyan-100'
              }`}
            >
              {(Object.keys(
                SECURITY_PROTOCOL_LABELS
              ) as SecurityProtocol[]).map((protocol) => (
                <option key={protocol} value={protocol}>
                  {SECURITY_PROTOCOL_LABELS[protocol]}
                </option>
              ))}
            </select>
          </FormField>

          {/* C. Password Protection */}
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-foreground">
              Password Protection
              <span className="ml-1 text-red-600" aria-hidden="true">*</span>
            </legend>
            <p id="password-protection-desc" className="text-xs text-muted">
              Whether clients require a password/passphrase to join this network.
            </p>
            <div
              className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 pt-1"
              role="radiogroup"
              aria-describedby="password-protection-desc"
            >
              {(['enabled', 'disabled', 'unknown'] as ProtectionStatus[]).map((status) => (
                <label
                  key={status}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm font-medium transition-all ${
                    formData.passwordProtection === status
                      ? 'border-cyan-600 bg-cyan-50/60 text-cyan-950 shadow-xs ring-1 ring-cyan-600'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="passwordProtection"
                    value={status}
                    checked={formData.passwordProtection === status}
                    onChange={(e) =>
                      handleInputChange(
                        'passwordProtection',
                        e.target.value as ProtectionStatus
                      )
                    }
                    className="h-4 w-4 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span>{PROTECTION_STATUS_LABELS[status]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* D. WPS Status */}
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-foreground">
              WPS (Wi-Fi Protected Setup)
            </legend>
            <p id="wps-desc" className="text-xs text-muted">
              WPS allows push-button or PIN connection, but legacy PIN mode has known vulnerabilities.
            </p>
            <div
              className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 pt-1"
              role="radiogroup"
              aria-describedby="wps-desc"
            >
              {(['enabled', 'disabled', 'unknown'] as ProtectionStatus[]).map((status) => (
                <label
                  key={status}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm font-medium transition-all ${
                    formData.wpsEnabled === status
                      ? 'border-cyan-600 bg-cyan-50/60 text-cyan-950 shadow-xs ring-1 ring-cyan-600'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="wpsEnabled"
                    value={status}
                    checked={formData.wpsEnabled === status}
                    onChange={(e) =>
                      handleInputChange(
                        'wpsEnabled',
                        e.target.value as ProtectionStatus
                      )
                    }
                    className="h-4 w-4 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span>{PROTECTION_STATUS_LABELS[status]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* E. Router Firmware Status */}
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-foreground">
              Router Firmware Status
            </legend>
            <p id="firmware-desc" className="text-xs text-muted">
              Outdated router firmware may leave known unpatched security holes exposed.
            </p>
            <div
              className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 pt-1"
              role="radiogroup"
              aria-describedby="firmware-desc"
            >
              {(['up-to-date', 'outdated', 'unknown'] as FirmwareStatus[]).map((status) => (
                <label
                  key={status}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm font-medium transition-all ${
                    formData.firmwareStatus === status
                      ? 'border-cyan-600 bg-cyan-50/60 text-cyan-950 shadow-xs ring-1 ring-cyan-600'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="firmwareStatus"
                    value={status}
                    checked={formData.firmwareStatus === status}
                    onChange={(e) =>
                      handleInputChange(
                        'firmwareStatus',
                        e.target.value as FirmwareStatus
                      )
                    }
                    className="h-4 w-4 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span>{FIRMWARE_STATUS_LABELS[status]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* F. Optional Notes */}
          <FormField
            id="notes"
            label="Optional Notes"
            description="Add context such as network location or router model (max 250 characters)."
            error={errors.notes}
          >
            <div>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                maxLength={250}
                placeholder="e.g. Study room dual-band router configured in 2024"
                aria-describedby="notes-counter notes-description"
                className="w-full rounded-lg border border-slate-300 p-3 text-sm transition-colors placeholder:text-slate-400 focus:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-100"
              />
              <div id="notes-counter" className="mt-1 text-right text-xs text-muted">
                {formData.notes.length}/250 characters
              </div>
            </div>
          </FormField>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4 text-slate-500" aria-hidden="true" />
            Reset Form
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-700 px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-cyan-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                  aria-hidden="true"
                />
                Analyzing Configuration...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Run Assessment
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
