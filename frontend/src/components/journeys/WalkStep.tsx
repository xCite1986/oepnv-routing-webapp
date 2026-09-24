import React from 'react';
import { Footprints } from 'lucide-react';
import { formatDuration, formatDistance } from '../../utils/formatters';

interface WalkStepProps {
  durationSeconds: number;
  distanceMeters?: number;
  label?: string;
  className?: string;
}

export const WalkStep: React.FC<WalkStepProps> = ({
  durationSeconds,
  distanceMeters,
  label = 'zu Fuß',
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-2 py-1.5 text-xs text-slate-500 font-medium ${className}`}>
      <Footprints className="w-3.5 h-3.5 text-slate-400" />
      <span>
        {formatDuration(durationSeconds)} {label}
        {distanceMeters ? ` (${formatDistance(distanceMeters)})` : ''}
      </span>
    </div>
  );
};
