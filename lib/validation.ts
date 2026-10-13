import type { AssessmentInput, ValidationErrors } from '@/types/assessment';

/**
 * Validates the assessment form input.
 * Returns an object with field-specific error messages.
 * An empty object means the input is valid.
 */
export function validateAssessmentInput(input: AssessmentInput): ValidationErrors {
  const errors: ValidationErrors = {};

  // Validate SSID
  const trimmedSsid = input.ssid.trim();
  if (!trimmedSsid) {
    errors.ssid = 'Network name (SSID) is required.';
  } else if (trimmedSsid.length > 32) {
    errors.ssid = 'Network name must be 32 characters or fewer.';
  }

  // Validate security protocol
  const validProtocols = ['open', 'wep', 'wpa2', 'wpa3', 'unknown'];
  if (!input.securityProtocol || !validProtocols.includes(input.securityProtocol)) {
    errors.securityProtocol = 'Please select a security protocol.';
  }

  // Validate notes length if provided
  if (input.notes && input.notes.length > 250) {
    errors.notes = 'Notes must be 250 characters or fewer.';
  }

  return errors;
}

/**
 * Checks if a ValidationErrors object contains any errors.
 */
export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}
