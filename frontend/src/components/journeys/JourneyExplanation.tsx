import React from 'react';
import { JourneyExplanation as JourneyExplanationType } from '../../types/routing';
import { Sparkles, CheckCircle } from 'lucide-react';

interface JourneyExplanationProps {
  explanation: JourneyExplanationType;
  isRecommended?: boolean;
  className?: string;
}

export const JourneyExplanation: React.FC<JourneyExplanationProps> = ({
  explanation,
  isRecommended = true,
  className = ''
}) => {
  if (!explanation || !explanation.details || explanation.details.length === 0) {
    return null;
  }

  return (
    <div
      className={`rounded-xl p-4 my-3 transition-all ${
        isRecommended
          ? 'bg-gradient-to-r from-red-50/80 via-rose-50/50 to-orange-50/60 border border-red-200/80 shadow-xs'
          : 'bg-slate-50 border border-slate-200'
      } ${className}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${isRecommended ? 'bg-red-600 text-white' : 'bg-slate-700 text-white'}`}>
          <Sparkles className="w-4 h-4" />
        </div>
        <h4 className="text-sm font-bold text-slate-900 tracking-tight">
          Warum diese Verbindung?
        </h4>
      </div>

      <div className="text-xs font-semibold text-slate-700 mb-1.5 pl-0.5">
        {explanation.headline}
      </div>

      <ul className="space-y-1.5">
        {explanation.details.map((detail, idx) => (
          <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span>{detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
