import React from 'react';
import { TransferInfo } from '../../types/routing';
import { formatDuration } from '../../utils/formatters';
import { ArrowRightLeft, ShieldCheck, AlertCircle } from 'lucide-react';

interface TransferStepProps {
  transfer: TransferInfo;
  className?: string;
}

export const TransferStep: React.FC<TransferStepProps> = ({ transfer, className = '' }) => {
  const isRelaxed = transfer.difficulty === 'RELAXED';
  const isTight = transfer.difficulty === 'TIGHT';

  return (
    <div className={`my-2 p-3 rounded-lg border bg-slate-50 text-slate-700 ${
      isTight ? 'border-amber-300 bg-amber-50/60' : 'border-slate-200'
    } ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-white shadow-xs text-slate-600">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800">
              Umstieg in {transfer.stationName}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {formatDuration(transfer.durationSeconds)} Zeit • ca. {transfer.walkingMeters} m Fußweg
            </div>
          </div>
        </div>

        {/* Transfer badge */}
        <div>
          {isRelaxed ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>{transfer.difficultyLabel || 'Entspannter Umstieg'}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              <AlertCircle className="w-3 h-3 text-amber-600" />
              <span>{transfer.difficultyLabel || 'Knapp, aber erreichbar'}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
