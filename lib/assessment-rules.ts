import type {
  AssessmentInput,
  AssessmentFinding,
  RiskLevel,
} from '@/types/assessment';

/**
 * The result returned by the assessment rule engine.
 */
export interface AssessmentResult {
  riskLevel: RiskLevel;
  summary: string;
  findings: AssessmentFinding[];
  recommendations: string[];
}

/**
 * Helper to raise risk level by one step.
 * low → medium, medium → high, high → high (capped).
 */
function raiseRisk(current: RiskLevel): RiskLevel {
  if (current === 'low') return 'medium';
  if (current === 'medium') return 'high';
  return 'high';
}

/**
 * Performs a WiFi security assessment based on user-provided input.
 *
 * Rules:
 * - Open / None → High risk always, never safe
 * - WEP → High risk always
 * - WPA2 → Low baseline if password enabled; raise risk for weaknesses
 * - WPA3 → Low baseline if password enabled and no weaknesses
 * - Disabled password → always High risk
 * - Enabled WPS → raise risk by one level (low→medium, medium→high)
 * - Outdated firmware → raise risk by one level
 * - Unknown settings → cautious result (treat as medium baseline minimum)
 * - Never classify Open or WEP as safe regardless of other settings
 *
 * Risk ordering: Low < Medium < High
 */
export function performAssessment(input: AssessmentInput): AssessmentResult {
  const findings: AssessmentFinding[] = [];
  const recommendations: string[] = [];
  let riskLevel: RiskLevel = 'low';

  // --- Step 1: Evaluate security protocol baseline ---
  // The encryption protocol is the most fundamental factor in WiFi security.
  switch (input.securityProtocol) {
    case 'open':
      // Open networks have zero encryption — always high risk
      riskLevel = 'high';
      findings.push({
        title: 'Open Network (No Encryption)',
        description:
          'This network has no encryption. All traffic can be intercepted by anyone within range.',
        severity: 'high',
      });
      recommendations.push(
        'Enable WPA3 or WPA2 encryption on your router immediately.'
      );
      recommendations.push(
        'Avoid transmitting sensitive data over this network.'
      );
      break;

    case 'wep':
      // WEP is fundamentally broken and can be cracked in minutes
      riskLevel = 'high';
      findings.push({
        title: 'WEP Encryption (Deprecated)',
        description:
          'WEP encryption has known vulnerabilities and can be cracked in minutes using widely available tools.',
        severity: 'high',
      });
      recommendations.push(
        'Upgrade from WEP to WPA3 or WPA2 encryption.'
      );
      break;

    case 'wpa2':
      // WPA2 is acceptable but not the strongest option available
      riskLevel = 'low';
      findings.push({
        title: 'WPA2 Encryption',
        description:
          'WPA2 provides reasonable security but is susceptible to certain attacks like KRACK. Consider upgrading to WPA3 if your router supports it.',
        severity: 'low',
      });
      recommendations.push(
        'Consider upgrading to WPA3 if your router and devices support it.'
      );
      break;

    case 'wpa3':
      // WPA3 is the current gold standard
      riskLevel = 'low';
      findings.push({
        title: 'WPA3 Encryption',
        description:
          'WPA3 is the latest and most secure Wi-Fi encryption standard. Good choice!',
        severity: 'low',
      });
      break;

    case 'unknown':
      // Can't verify security — treat cautiously with medium baseline
      riskLevel = 'medium';
      findings.push({
        title: 'Unknown Security Protocol',
        description:
          'The security protocol could not be determined. This makes it difficult to assess the network security accurately.',
        severity: 'medium',
      });
      recommendations.push(
        'Check your router settings to identify the security protocol in use.'
      );
      recommendations.push(
        'Ensure your router uses WPA3 or WPA2 encryption.'
      );
      break;
  }

  // --- Step 2: Evaluate password protection ---
  // A network without a password is accessible to anyone, regardless of encryption.
  switch (input.passwordProtection) {
    case 'disabled':
      // No password = always high risk, overrides everything
      riskLevel = 'high';
      findings.push({
        title: 'Password Protection Disabled',
        description:
          'The network has no password protection. Anyone can connect to this network.',
        severity: 'high',
      });
      recommendations.push(
        'Enable password protection with a strong, unique password.'
      );
      recommendations.push(
        'Use a password with at least 12 characters, mixing letters, numbers, and symbols.'
      );
      break;

    case 'unknown':
      // Can't confirm password — bump low risk to medium as a precaution
      if (riskLevel === 'low') riskLevel = 'medium';
      findings.push({
        title: 'Password Protection Status Unknown',
        description:
          'It could not be confirmed whether password protection is enabled. This is a potential security concern.',
        severity: 'medium',
      });
      recommendations.push(
        'Verify that password protection is enabled on your router.'
      );
      break;

    case 'enabled':
      // Good — password is active
      findings.push({
        title: 'Password Protection Enabled',
        description:
          'Password protection is active, which helps prevent unauthorized access.',
        severity: 'low',
      });
      break;
  }

  // --- Step 3: Evaluate WPS ---
  // WPS PIN attacks are a well-known vulnerability; enabled WPS raises risk.
  switch (input.wpsEnabled) {
    case 'enabled':
      // WPS has brute-force PIN vulnerabilities — raise risk one level
      riskLevel = raiseRisk(riskLevel);
      findings.push({
        title: 'WPS Enabled',
        description:
          'Wi-Fi Protected Setup (WPS) has known vulnerabilities that can allow attackers to gain access to the network through brute-force PIN attacks.',
        severity: 'medium',
      });
      recommendations.push(
        'Disable WPS on your router to reduce the attack surface.'
      );
      break;

    case 'unknown':
      // WPS is often on by default — note the uncertainty
      findings.push({
        title: 'WPS Status Unknown',
        description:
          'The WPS status could not be determined. WPS is often enabled by default and may pose a security risk.',
        severity: 'low',
      });
      recommendations.push(
        'Check your router settings and disable WPS if it is enabled.'
      );
      break;

    case 'disabled':
      // Good practice
      findings.push({
        title: 'WPS Disabled',
        description:
          'WPS is disabled, which is a good security practice.',
        severity: 'low',
      });
      break;
  }

  // --- Step 4: Evaluate firmware ---
  // Outdated firmware may contain known exploitable vulnerabilities.
  switch (input.firmwareStatus) {
    case 'outdated':
      // Known vulnerabilities in old firmware — raise risk one level
      riskLevel = raiseRisk(riskLevel);
      findings.push({
        title: 'Firmware Outdated',
        description:
          'Outdated router firmware may contain known security vulnerabilities that attackers can exploit.',
        severity: 'medium',
      });
      recommendations.push(
        'Update your router firmware to the latest version available from the manufacturer.'
      );
      recommendations.push(
        'Enable automatic firmware updates if your router supports this feature.'
      );
      break;

    case 'unknown':
      // Can't verify — flag for the user to check
      findings.push({
        title: 'Firmware Status Unknown',
        description:
          'The firmware update status could not be determined. Outdated firmware may contain security vulnerabilities.',
        severity: 'low',
      });
      recommendations.push(
        "Check your router manufacturer's website for firmware updates."
      );
      break;

    case 'up-to-date':
      // Good — firmware is current
      findings.push({
        title: 'Firmware Up to Date',
        description:
          'The router firmware is reported as up to date, which helps protect against known vulnerabilities.',
        severity: 'low',
      });
      break;
  }

  // --- Step 5: Ensure Open/WEP/no-password networks are never classified below High ---
  // This is a safety net: even if other settings are good, fundamentally
  // broken encryption or no password must always result in high risk.
  if (
    input.securityProtocol === 'open' ||
    input.securityProtocol === 'wep'
  ) {
    riskLevel = 'high';
  }
  if (input.passwordProtection === 'disabled') {
    riskLevel = 'high';
  }

  // --- Step 6: Generate a human-readable summary based on final risk level ---
  let summary: string;
  switch (riskLevel) {
    case 'high':
      summary =
        'This network configuration has significant security weaknesses that should be addressed immediately. The current settings leave the network vulnerable to common attacks.';
      break;
    case 'medium':
      summary =
        'This network configuration has some security concerns that should be reviewed. While basic protection is in place, improvements are recommended to strengthen security.';
      break;
    case 'low':
      summary =
        'This network configuration follows good security practices. The current settings provide a reasonable level of protection against common threats.';
      break;
  }

  // Add a general maintenance recommendation if nothing specific was flagged
  if (recommendations.length === 0) {
    recommendations.push(
      'Continue to monitor your network security and keep your router firmware updated.'
    );
  }

  return { riskLevel, summary, findings, recommendations };
}
