'use client';

import PageContainer from '@/components/layout/PageContainer';
import AssessmentForm from '@/components/assessment/AssessmentForm';
import { ShieldCheck, HelpCircle } from 'lucide-react';

export default function CheckPage() {
  return (
    <PageContainer
      title="New Assessment"
      description="Evaluate a wireless network configuration and identify potential security risks."
    >
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Intro Guidance */}
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-cyan-50 p-2.5 text-cyan-700">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Guided Wi-Fi Security Checkup
              </h2>
              <p className="mt-1 text-sm text-muted leading-relaxed">
                Fill in the technical details of your router or wireless network as configured in your router admin panel. The rule engine calculates an objective risk rating based on cybersecurity standards.
              </p>
            </div>
          </div>
        </div>

        {/* Assessment Form */}
        <AssessmentForm />

        {/* Evaluation FAQ / Guidance Card */}
        <div className="rounded-xl border border-card-border bg-slate-50/70 p-6">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
            <HelpCircle className="h-4 w-4 text-cyan-700" aria-hidden="true" />
            <span>How does WiFi Check calculate risk?</span>
          </div>
          <ul className="mt-3 space-y-2 text-xs text-muted list-disc list-inside leading-relaxed">
            <li>
              <strong>Open / WEP:</strong> Classified as <span className="text-rose-600 font-medium">High Risk</span> immediately due to absence of encryption or deprecated ciphers.
            </li>
            <li>
              <strong>WPA2 / WPA3:</strong> Provide a <span className="text-emerald-600 font-medium">Low Risk</span> baseline when paired with strong password protection.
            </li>
            <li>
              <strong>WPS / Outdated Firmware:</strong> Elevates the risk level by one or more tiers due to known exploitable attack vectors.
            </li>
            <li>
              <strong>Unknown Settings:</strong> Evaluated cautiously rather than assuming the network is secure.
            </li>
          </ul>
        </div>
      </div>
    </PageContainer>
  );
}

