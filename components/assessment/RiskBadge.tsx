import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import type { RiskLevel } from '@/types/assessment';

interface RiskBadgeProps {
  level: RiskLevel;
  /** Optional: show as a larger version for detail pages */
  size?: 'sm' | 'md' | 'lg';
}

// Style configuration for each risk level
const riskStyles: Record<RiskLevel, { bg: string; text: string; border: string; label: string; Icon: typeof ShieldCheck }> = {
  low: {
    bg: 'bg-risk-low-bg',
    text: 'text-risk-low',
    border: 'border-risk-low-border',
    label: 'Low Risk',
    Icon: ShieldCheck,
  },
  medium: {
    bg: 'bg-risk-medium-bg',
    text: 'text-risk-medium',
    border: 'border-risk-medium-border',
    label: 'Medium Risk',
    Icon: ShieldAlert,
  },
  high: {
    bg: 'bg-risk-high-bg',
    text: 'text-risk-high',
    border: 'border-risk-high-border',
    label: 'High Risk',
    Icon: ShieldX,
  },
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-1 text-sm gap-1.5',
  lg: 'px-3 py-1.5 text-base gap-2',
};

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export default function RiskBadge({ level, size = 'md' }: RiskBadgeProps) {
  const style = riskStyles[level];
  const Icon = style.Icon;

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${style.bg} ${style.text} ${style.border} ${sizeStyles[size]}`}
    >
      <Icon className={iconSizes[size]} aria-hidden="true" />
      {style.label}
    </span>
  );
}
