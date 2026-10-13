import type { Assessment, AssessmentInput } from '@/types/assessment';
import { performAssessment } from '@/lib/assessment-rules';

/**
 * Helper to create a mock assessment from input data.
 * Uses the same performAssessment rules as user-submitted assessments
 * so that mock data and real data are always consistent.
 */
function createMockAssessment(
  id: string,
  input: AssessmentInput,
  createdAt: string
): Assessment {
  const result = performAssessment(input);
  return {
    id,
    ...input,
    ssid: input.ssid.trim(),
    ...result,
    createdAt,
  };
}

// Mock input data for 6 fictional networks covering a range of risk levels
const mockInputs: { id: string; input: AssessmentInput; date: string }[] = [
  {
    id: 'mock-001',
    input: {
      ssid: 'Kos-Study-WiFi',
      securityProtocol: 'wpa3',
      passwordProtection: 'enabled',
      wpsEnabled: 'disabled',
      firmwareStatus: 'up-to-date',
      notes: 'Well-configured study network with latest security.',
    },
    date: '2026-10-10T09:30:00.000Z',
  },
  {
    id: 'mock-002',
    input: {
      ssid: 'HomeNetwork-01',
      securityProtocol: 'wpa2',
      passwordProtection: 'enabled',
      wpsEnabled: 'enabled',
      firmwareStatus: 'outdated',
      notes: 'Home router with default WPS still on.',
    },
    date: '2026-10-09T14:15:00.000Z',
  },
  {
    id: 'mock-003',
    input: {
      ssid: 'Campus-Guest',
      securityProtocol: 'open',
      passwordProtection: 'disabled',
      wpsEnabled: 'disabled',
      firmwareStatus: 'unknown',
      notes: 'Open guest network available in campus common area.',
    },
    date: '2026-10-08T11:00:00.000Z',
  },
  {
    id: 'mock-004',
    input: {
      ssid: 'Apartment-WiFi',
      securityProtocol: 'wpa2',
      passwordProtection: 'enabled',
      wpsEnabled: 'disabled',
      firmwareStatus: 'up-to-date',
      notes: 'Apartment shared network, seems well maintained.',
    },
    date: '2026-10-07T16:45:00.000Z',
  },
  {
    id: 'mock-005',
    input: {
      ssid: 'StudyRoom-Net',
      securityProtocol: 'wep',
      passwordProtection: 'enabled',
      wpsEnabled: 'enabled',
      firmwareStatus: 'outdated',
      notes: 'Old router in study room, needs upgrade.',
    },
    date: '2026-10-06T10:20:00.000Z',
  },
  {
    id: 'mock-006',
    input: {
      ssid: 'Lab-Network',
      securityProtocol: 'wpa2',
      passwordProtection: 'enabled',
      wpsEnabled: 'unknown',
      firmwareStatus: 'unknown',
      notes: 'Lab network, configuration details not fully known.',
    },
    date: '2026-10-05T08:30:00.000Z',
  },
];

// Generate mock assessments using the same rules as user submissions
export const mockAssessments: Assessment[] = mockInputs.map(
  ({ id, input, date }) => createMockAssessment(id, input, date)
);
