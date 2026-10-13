// Security protocol options
export type SecurityProtocol = 'open' | 'wep' | 'wpa2' | 'wpa3' | 'unknown';

// Status options for yes/no/unknown fields
export type ProtectionStatus = 'enabled' | 'disabled' | 'unknown';

// Firmware status options
export type FirmwareStatus = 'up-to-date' | 'outdated' | 'unknown';

// Risk level classification
export type RiskLevel = 'low' | 'medium' | 'high';

// Form input data (what the user submits)
export interface AssessmentInput {
  ssid: string;
  securityProtocol: SecurityProtocol;
  passwordProtection: ProtectionStatus;
  wpsEnabled: ProtectionStatus;
  firmwareStatus: FirmwareStatus;
  notes: string;
}

// A single finding from the assessment
export interface AssessmentFinding {
  title: string;
  description: string;
  severity: RiskLevel;
}

// Complete assessment record
export interface Assessment {
  id: string;
  ssid: string;
  securityProtocol: SecurityProtocol;
  passwordProtection: ProtectionStatus;
  wpsEnabled: ProtectionStatus;
  firmwareStatus: FirmwareStatus;
  notes: string;
  riskLevel: RiskLevel;
  summary: string;
  findings: AssessmentFinding[];
  recommendations: string[];
  createdAt: string; // ISO 8601 date string
}

// Validation errors for the form
export interface ValidationErrors {
  ssid?: string;
  securityProtocol?: string;
  passwordProtection?: string;
  [key: string]: string | undefined;
}

// Display labels for select options
export const SECURITY_PROTOCOL_LABELS: Record<SecurityProtocol, string> = {
  open: 'Open / None',
  wep: 'WEP',
  wpa2: 'WPA2',
  wpa3: 'WPA3',
  unknown: 'Other / Unknown',
};

export const PROTECTION_STATUS_LABELS: Record<ProtectionStatus, string> = {
  enabled: 'Enabled',
  disabled: 'Disabled',
  unknown: 'Unknown',
};

export const FIRMWARE_STATUS_LABELS: Record<FirmwareStatus, string> = {
  'up-to-date': 'Up to Date',
  outdated: 'Outdated',
  unknown: 'Unknown',
};

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk',
};
