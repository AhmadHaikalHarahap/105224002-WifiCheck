'use server';

import { assessmentSchema } from '@/lib/skema';
import type { AssessmentInput } from '@/types/assessment';

export interface ActionState {
  errors?: {
    ssid?: string[];
    securityProtocol?: string[];
    passwordProtection?: string[];
    wpsEnabled?: string[];
    firmwareStatus?: string[];
    notes?: string[];
    _form?: string[];
  };
  previousInput?: Partial<AssessmentInput>;
  success?: boolean;
  data?: AssessmentInput;
}

export async function validateAssessmentAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const rawData = {
    ssid: formData.get('ssid'),
    securityProtocol: formData.get('securityProtocol'),
    passwordProtection: formData.get('passwordProtection'),
    wpsEnabled: formData.get('wpsEnabled'),
    firmwareStatus: formData.get('firmwareStatus'),
    notes: formData.get('notes') ?? '',
  };

  const previousInput: Partial<AssessmentInput> = {
    ssid: typeof rawData.ssid === 'string' ? rawData.ssid : '',
    securityProtocol:
      typeof rawData.securityProtocol === 'string'
        ? (rawData.securityProtocol as AssessmentInput['securityProtocol'])
        : 'wpa2',
    passwordProtection:
      typeof rawData.passwordProtection === 'string'
        ? (rawData.passwordProtection as AssessmentInput['passwordProtection'])
        : 'enabled',
    wpsEnabled:
      typeof rawData.wpsEnabled === 'string'
        ? (rawData.wpsEnabled as AssessmentInput['wpsEnabled'])
        : 'disabled',
    firmwareStatus:
      typeof rawData.firmwareStatus === 'string'
        ? (rawData.firmwareStatus as AssessmentInput['firmwareStatus'])
        : 'up-to-date',
    notes: typeof rawData.notes === 'string' ? rawData.notes : '',
  };

  const result = assessmentSchema.safeParse(rawData);

  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors;
    return {
      errors: {
        ssid: fieldErrors.ssid,
        securityProtocol: fieldErrors.securityProtocol,
        passwordProtection: fieldErrors.passwordProtection,
        wpsEnabled: fieldErrors.wpsEnabled,
        firmwareStatus: fieldErrors.firmwareStatus,
        notes: fieldErrors.notes,
      },
      previousInput,
    };
  }

  return {
    success: true,
    data: result.data as AssessmentInput,
  };
}
