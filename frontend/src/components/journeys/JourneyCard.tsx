import React, { useState } from 'react';
import { Journey, Leg } from '../../types/routing';
import { formatTime, formatDuration, formatDistance, getLineColors } from '../../utils/formatters';
import { RealtimeBadge } from '../common/RealtimeBadge';
import { JourneyExplanation } from './JourneyExplanation';
import { AlternativeComparison } from './AlternativeComparison';
import { JourneyTimeline } from './JourneyTimeline';
import { ChevronDown, ChevronUp, ArrowRight, Footprints, ArrowRightLeft, Sparkles, BarChart2, ShieldCheck, Gauge } from 'lucide-react';

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

          <div className="flex items-center gap-2">
            {journey.reliabilityPercent && (
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                journey.recommended
                  ? 'bg-white/20 text-white'
                  : journey.reliabilityPercent >= 90
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                <ShieldCheck className="w-3 h-3" />
                <span>{journey.reliabilityPercent}% Zuverlässigkeit</span>
              </span>
            )}
            {journey.realtime && (
              <span className="text-[11px] font-medium opacity-90">
                Live-Echtzeit geprüft
              </span>
            )}
          </div>
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

          {/* Cost Function Breakdown Card - Styled in matching WienMobil Red */}
          {journey.costBreakdown && (
            <div className="my-3 p-3.5 rounded-2xl bg-gradient-to-br from-red-50/95 via-rose-50/60 to-red-100/40 text-slate-800 text-xs border border-red-200/90 shadow-2xs">
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-red-200/70">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-red-600 to-rose-600 text-white flex items-center justify-center shadow-xs shadow-red-500/20">
                    <Gauge className="w-3 h-3" />
                  </div>
                  <span className="font-bold text-red-950">Kosten- &amp; Risiko-Score</span>
                  <span className="font-mono text-white font-extrabold text-xs px-2.5 py-0.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 shadow-2xs shadow-red-500/25">
                    {journey.costBreakdown.costScore.toFixed(0)}
                  </span>
                </div>
                <div className="text-[10px] text-red-800/80 font-mono font-medium">
                  &alpha;={journey.costBreakdown.alpha} &bull; &beta;={journey.costBreakdown.beta} &bull; &gamma;={journey.costBreakdown.gamma}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="bg-white/95 border border-red-100/80 p-2.5 rounded-xl shadow-2xs">
                  <div className="text-slate-500 text-[10px] font-medium">ETA (Dauer)</div>
                  <div className="font-bold text-slate-900 font-mono text-xs">{journey.costBreakdown.etaMinutes} min</div>
                </div>

                <div className="bg-white/95 border border-red-100/80 p-2.5 rounded-xl shadow-2xs">
                  <div className="text-slate-500 text-[10px] font-medium">Umstiegs-Penalty</div>
                  <div className="font-bold text-amber-700 font-mono text-xs">+{Math.round(journey.costBreakdown.transferPenalty)}s</div>
                </div>

                <div className="bg-white/95 border border-red-100/80 p-2.5 rounded-xl shadow-2xs">
                  <div className="text-slate-500 text-[10px] font-medium">Anschluss-Risiko</div>
                  <div className="font-bold text-red-600 font-mono text-xs">+{Math.round(journey.costBreakdown.missedConnectionRisk)}s</div>
                </div>

                <div className="bg-white/95 border border-red-100/80 p-2.5 rounded-xl shadow-2xs">
                  <div className="text-slate-500 text-[10px] font-medium">Störungs-Risiko</div>
                  <div className="font-bold text-purple-700 font-mono text-xs">+{Math.round(journey.costBreakdown.disruptionRisk)}s</div>
                </div>
              </div>
            </div>
          )}

          {/* Alternative comparison box if not recommended */}
          {!journey.recommended && journey.comparisonWithRecommended && (
            <div className="my-3">
              <AlternativeComparison comparison={journey.comparisonWithRecommended} />
            </div>
          )}

          {/* Focus button in Zeit-Weg-Grafik */}
          {onShowOnMap && (
            <div className="my-2 flex justify-end">
              <button
                type="button"
                onClick={() => onShowOnMap(journey)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                title="Diese Route in der Zeit-Weg-Liniengrafik fokussieren"
              >
                <BarChart2 className="w-3.5 h-3.5 text-red-600" />
                <span>In Grafik fokussieren</span>
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
