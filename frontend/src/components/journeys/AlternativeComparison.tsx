import React from 'react';
import { AlternativeComparison as AlternativeComparisonType } from '../../types/routing';
import { Info, Clock, AlertTriangle, Footprints } from 'lucide-react';

interface AlternativeComparisonProps {
  comparison: AlternativeComparisonType;
  className?: string;
}

export const AlternativeComparison: React.FC<AlternativeComparisonProps> = ({
  comparison,
  className = ''
}) => {
  return (
    <div className={`p-3 rounded-lg bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 ${className}`}>
      <div className="flex items-center gap-1.5 font-semibold text-amber-950 mb-1">
        <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
        <span>Vergleich zur empfohlenen Verbindung:</span>
      </div>

      <div className="font-medium text-amber-900 mb-1.5 pl-5">
        {comparison.summaryText}
      </div>

      {comparison.reasons && comparison.reasons.length > 0 && (
        <ul className="space-y-1 pl-5">
          {comparison.reasons.map((reason, idx) => (
            <li key={idx} className="flex items-center gap-1.5 text-amber-800">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
