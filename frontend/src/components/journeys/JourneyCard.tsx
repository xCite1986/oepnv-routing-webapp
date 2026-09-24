import React, { useState } from 'react';
import { Journey, Leg } from '../../types/routing';
import { formatTime, formatDuration, formatDistance, getLineColors } from '../../utils/formatters';
import { RealtimeBadge } from '../common/RealtimeBadge';
import { JourneyExplanation } from './JourneyExplanation';
import { AlternativeComparison } from './AlternativeComparison';
import { JourneyTimeline } from './JourneyTimeline';
import { ChevronDown, ChevronUp, ArrowRight, Footprints, ArrowRightLeft, Sparkles, Map } from 'lucide-react';

interface JourneyCardProps {
  journey: Journey;
  isSelected?: boolean;
  defaultExpanded?: boolean;
  onSelectJourney?: (journey: Journey) => void;
  onSelectLeg?: (leg: Leg) => void;
  onShowOnMap?: (journey: Journey) => void;
}

export const JourneyCard: React.FC<JourneyCardProps> = ({
  journey,
  isSelected = false,
  defaultExpanded = false,
  onSelectJourney,
  onSelectLeg,
  onShowOnMap,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded || journey.recommended);

  // Transit lines summary (e.g. U1 -> S7)
  const transitLegs = journey.legs.filter((l) => l.type !== 'WALK');

  const toggleExpand = () => {
    setIsExpanded((prev) => !prev);
    onSelectJourney?.(journey);
  };

  return (
    <article
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        journey.recommended
          ? 'bg-white border-red-300 shadow-md ring-1 ring-red-400/30'
          : isSelected
          ? 'bg-white border-blue-400 shadow-sm ring-1 ring-blue-400/20'
          : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-xs'
      }`}
    >
      {/* Top Banner for Categories (EMPFOHLEN / DIREKTER / WENIGER ZU FUSS) */}
      {journey.tagLabel && (
        <div
          className={`px-4 py-1.5 flex items-center justify-between text-xs font-bold tracking-wider ${
            journey.recommended
              ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white'
              : journey.categoryTag === 'DIREKTER'
              ? 'bg-slate-100 text-slate-700 border-b border-slate-200'
              : 'bg-slate-100 text-slate-700 border-b border-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5">
            {journey.recommended && <Sparkles className="w-3.5 h-3.5" />}
            <span>{journey.tagLabel}</span>
          </div>

          {journey.realtime && (
            <span className="text-[11px] font-medium opacity-90">
              Live-Echtzeit geprüft
            </span>
          )}
        </div>
      )}

      {/* Main Clickable Card Summary */}
      <div
        onClick={toggleExpand}
        className="p-4 sm:p-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
      >
        {/* Row 1: Time, Duration & Status */}
        <div className="flex items-baseline justify-between gap-3 mb-2">
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {formatTime(journey.departureTime)}
            </span>
            <span className="text-slate-400 font-medium">
              <ArrowRight className="w-4 h-4 inline" />
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {formatTime(journey.arrivalTime)}
            </span>
          </div>

          <div className="text-right">
            <span className="text-base sm:text-lg font-bold text-slate-900">
              {formatDuration(journey.durationSeconds)}
            </span>
          </div>
        </div>

        {/* Row 2: Transit Lines Pills (U1 -> S7) */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {transitLegs.length === 0 ? (
            <span className="text-xs font-medium text-slate-500">Nur Fußweg</span>
          ) : (
            transitLegs.map((leg, idx) => {
              const colors = getLineColors(leg.line, leg.type);
              return (
                <React.Fragment key={leg.id || idx}>
                  {idx > 0 && <span className="text-slate-300 text-xs">›</span>}
                  <span
                    className="px-2 py-0.5 rounded text-xs font-bold shadow-2xs"
                    style={{ backgroundColor: colors.bg, color: colors.text }}
                  >
                    {leg.line || leg.type}
                  </span>
                </React.Fragment>
              );
            })
          )}
        </div>

        {/* Row 3: Meta details (Transfers, Walking time, Realtime Delay) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-medium text-slate-600">
              <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
              {journey.transferCount === 0
                ? '0 Umstiege'
                : journey.transferCount === 1
                ? '1 Umstieg'
                : `${journey.transferCount} Umstiege`}
            </span>

            <span className="flex items-center gap-1 font-medium text-slate-600">
              <Footprints className="w-3.5 h-3.5 text-slate-400" />
              {formatDuration(journey.walkingSeconds)} zu Fuß ({formatDistance(journey.walkingMeters)})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <RealtimeBadge
              status={
                journey.totalDelayMinutes > 0
                  ? 'DELAYED'
                  : journey.hasDisruptions
                  ? 'DISRUPTED'
                  : 'ON_TIME'
              }
              delayMinutes={journey.totalDelayMinutes}
              disruptionNotice={journey.hasDisruptions ? 'Störung gemeldet' : undefined}
              size="sm"
            />

            <div className="text-slate-400 hover:text-slate-700 ml-1">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Details Section: Explanation, Timeline & Alternative Comparison */}
      {isExpanded && (
        <div className="px-4 pb-5 sm:px-5 pt-0 border-t border-slate-100 bg-slate-50/40">
          {/* Why this journey explanation box */}
          {journey.explanation && (
            <JourneyExplanation
              explanation={journey.explanation}
              isRecommended={journey.recommended}
            />
          )}

          {/* Alternative comparison box if not recommended */}
          {!journey.recommended && journey.comparisonWithRecommended && (
            <div className="my-3">
              <AlternativeComparison comparison={journey.comparisonWithRecommended} />
            </div>
          )}

          {/* Interactive Map toggle button for mobile/compact views */}
          {onShowOnMap && (
            <div className="my-2 flex justify-end">
              <button
                type="button"
                onClick={() => onShowOnMap(journey)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <Map className="w-3.5 h-3.5 text-blue-600" />
                <span>Auf Karte zeigen</span>
              </button>
            </div>
          )}

          {/* Vertical Timeline */}
          <div className="mt-2 bg-white rounded-xl p-3 border border-slate-200/80">
            <JourneyTimeline journey={journey} onSelectLeg={onSelectLeg} />
          </div>
        </div>
      )}
    </article>
  );
};
