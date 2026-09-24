import React from 'react';
import { RealtimeStatus } from '../../types/routing';
import { CheckCircle2, Clock, AlertTriangle, XCircle } from 'lucide-react';

interface RealtimeBadgeProps {
  status: RealtimeStatus;
  delayMinutes?: number;
  isCancelled?: boolean;
  disruptionNotice?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const RealtimeBadge: React.FC<RealtimeBadgeProps> = ({
  status,
  delayMinutes = 0,
  isCancelled = false,
  disruptionNotice,
  className = '',
  size = 'md'
}) => {
  const isSmall = size === 'sm';
  const padding = isSmall ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  if (isCancelled || status === 'CANCELLED') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200 ${padding} ${className}`}>
        <XCircle className={isSmall ? "w-3 h-3" : "w-3.5 h-3.5"} />
        <span>Fällt aus</span>
      </span>
    );
  }

  if (status === 'STOP_SKIPPED') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200 ${padding} ${className}`}>
        <AlertTriangle className={isSmall ? "w-3 h-3" : "w-3.5 h-3.5"} />
        <span>Halt entfällt</span>
      </span>
    );
  }

  if (disruptionNotice || status === 'DISRUPTED') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-md bg-amber-50 text-amber-900 border border-amber-300 ${padding} ${className}`} title={disruptionNotice}>
        <AlertTriangle className={isSmall ? "w-3 h-3 text-amber-600" : "w-3.5 h-3.5 text-amber-600"} />
        <span>{delayMinutes > 0 ? `+${delayMinutes} min • Störung` : 'Störung auf der Linie'}</span>
      </span>
    );
  }

  if (delayMinutes >= 3) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 ${padding} ${className}`}>
        <Clock className={isSmall ? "w-3 h-3" : "w-3.5 h-3.5"} />
        <span>+{delayMinutes} min Verspätung</span>
      </span>
    );
  }

  if (delayMinutes > 0) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 ${padding} ${className}`}>
        <Clock className={isSmall ? "w-3 h-3" : "w-3.5 h-3.5"} />
        <span>+{delayMinutes} min</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 ${padding} ${className}`}>
      <CheckCircle2 className={isSmall ? "w-3 h-3" : "w-3.5 h-3.5"} />
      <span>Pünktlich</span>
    </span>
  );
};
