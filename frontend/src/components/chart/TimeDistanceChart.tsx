import React from 'react';
import { Journey, Leg } from '../../types/routing';
import { formatTime, formatDuration, getLineColors } from '../../utils/formatters';
import { exportJourneyAsGraphic } from '../../utils/exportRouteGraphic';
import {
  Download,
  BarChart2,
  Footprints,
  ArrowRightLeft,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  MapPin,
  ShieldCheck,
  TrendingDown,
} from 'lucide-react';

interface TimeDistanceChartProps {
  journeys: Journey[];
  selectedJourney?: Journey | null;
  onSelectJourney?: (journey: Journey) => void;
  onCloseMobile?: () => void;
}

export const TimeDistanceChart: React.FC<TimeDistanceChartProps> = ({
  journeys,
  selectedJourney,
  onSelectJourney,
  onCloseMobile,
}) => {
  // Falls keine Route explizit ausgewählt ist, ist die empfohlene Route die Standardauswahl für den Export
  const activeJourneyForExport = selectedJourney || journeys[0] || null;

  const handleDownload = () => {
    if (!activeJourneyForExport) return;
    const title = activeJourneyForExport.tagLabel
      ? `Route: ${activeJourneyForExport.tagLabel}`
      : 'WienMobil Route';
    exportJourneyAsGraphic(activeJourneyForExport, title);
  };

  if (!journeys || journeys.length === 0) {
    return (
      <div className="h-full bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
          <BarChart2 className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800">
          Zeit-Weg-Liniengrafik
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Starte links eine Verbindungssuche, um gefundene Routen, Fahrzeiten und Umstiege grafisch zu vergleichen.
        </p>
      </div>
    );
  }

  const hasSelection = Boolean(selectedJourney);

  return (
    <div className="h-full bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
      {/* Chart Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center text-white shadow-md shadow-red-500/20 shrink-0">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Zeit-Weg-Liniengrafik
              </h2>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {journeys.length} Optionen
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Fahrzeiten, Linien &amp; Umstiege im vertikalen Direktvergleich
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Export Graphic Button */}
          {activeJourneyForExport && (
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Aktuell gewählte Route als hochauflösende PNG-Grafik herunterladen"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Grafik exportieren</span>
            </button>
          )}

          {/* Close button on mobile */}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Schließen"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Sub-Header Legend & Hint */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
            <span>U-Bahn</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
            <span>S-Bahn / ÖBB</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm border border-dashed border-slate-400 bg-slate-200"></span>
            <span>Fußweg</span>
          </span>
          <span className="flex items-center gap-1">
            <ArrowRightLeft className="w-3 h-3 text-slate-500" />
            <span>Umstiegszeit</span>
          </span>
        </div>

        <div className="text-slate-400 italic">
          {hasSelection
            ? 'Klicke auf einen Balken, um eine andere Route zu fokussieren'
            : 'Wähle links eine Route, um sie hervorzuheben'}
        </div>
      </div>

      {/* Main Content Area: Side-by-Side Vertical Columns */}
      <div className="flex-1 overflow-x-auto overflow-y-auto p-4 sm:p-5 bg-slate-100/60">
        <div className="flex items-stretch gap-4 min-w-max pb-2">
          {journeys.map((journey) => {
            const isSelected = selectedJourney?.id === journey.id;
            const isDimmed = hasSelection && !isSelected;
            const durationMin = Math.round(journey.durationSeconds / 60);

            return (
              <div
                key={journey.id}
                onClick={() => onSelectJourney?.(journey)}
                className={`w-[260px] sm:w-[280px] flex flex-col rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                  isSelected
                    ? 'bg-white border-red-500 ring-2 ring-red-400/40 shadow-xl opacity-100 scale-[1.01] z-10'
                    : isDimmed
                    ? 'bg-slate-50/80 border-slate-200 opacity-40 grayscale-[25%] hover:opacity-85 hover:border-slate-300'
                    : 'bg-white border-slate-200 shadow-sm hover:border-red-300 opacity-100'
                }`}
              >
                {/* Column Top Card Header */}
                <div
                  className={`p-3.5 border-b ${
                    isSelected
                      ? 'bg-gradient-to-br from-red-50 via-rose-50 to-white border-red-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        journey.recommended
                          ? 'bg-red-600 text-white shadow-2xs'
                          : journey.categoryTag === 'DIREKTER'
                          ? 'bg-slate-800 text-white'
                          : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {journey.tagLabel || 'Option'}
                    </span>

                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Ausgewählt</span>
                      </span>
                    )}
                  </div>

                  {/* Travel Time & Timespan */}
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-2xl font-black text-slate-900 tracking-tight">
                        {durationMin} min
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        {formatTime(journey.departureTime)} &rarr; {formatTime(journey.arrivalTime)}
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-slate-600 font-semibold">
                      <div className="flex items-center justify-end gap-1">
                        <ArrowRightLeft className="w-3 h-3 text-slate-400" />
                        <span>
                          {journey.transferCount === 0
                            ? 'Direktfahrt'
                            : `${journey.transferCount} ${journey.transferCount === 1 ? 'Umstieg' : 'Umstiege'}`}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {formatDuration(journey.walkingSeconds)} Fußweg
                      </div>
                    </div>
                  </div>

                  {/* Reliability pill */}
                  {journey.reliabilityPercent && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Zuverlässigkeit:</span>
                      </span>
                      <span className="font-bold text-slate-800">
                        {journey.reliabilityPercent}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Vertical Timeline Track (The Bar) */}
                <div className="flex-1 p-3.5 space-y-2 bg-slate-50/50">
                  {/* Origin Station */}
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-slate-900 ring-2 ring-slate-200 shrink-0"></div>
                    <div className="truncate">
                      <span className="font-bold text-slate-900">
                        {formatTime(journey.departureTime)}
                      </span>{' '}
                      <span className="text-slate-600">
                        {journey.legs[0]?.fromStop.name}
                      </span>
                    </div>
                  </div>

                  {/* Vertical Legs */}
                  <div className="pl-1.5 space-y-2 border-l-2 border-slate-200 ml-1.5 py-1">
                    {journey.legs.map((leg, legIdx) => {
                      const isWalk = leg.type === 'WALK';
                      const legMin = Math.round(leg.durationSeconds / 60);
                      const colors = getLineColors(leg.line, leg.type);

                      // Proportionale Mindesthöhe für ein echtes Zeit-Weg-Diagramm
                      const heightPx = Math.max(50, Math.min(130, legMin * 3.6));

                      return (
                        <div key={leg.id || legIdx} className="space-y-2">
                          {/* The Leg Block */}
                          <div
                            style={
                              isWalk
                                ? { minHeight: `${heightPx}px` }
                                : {
                                    backgroundColor: colors.bg,
                                    color: colors.text,
                                    minHeight: `${heightPx}px`,
                                  }
                            }
                            className={`rounded-xl p-2.5 flex flex-col justify-between transition-all ${
                              isWalk
                                ? 'bg-white border border-dashed border-slate-300 text-slate-700 shadow-2xs'
                                : 'shadow-xs text-white'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-1.5">
                                {isWalk ? (
                                  <>
                                    <Footprints className="w-3.5 h-3.5 text-slate-500" />
                                    <span className="text-xs font-bold text-slate-800">
                                      Fußweg
                                    </span>
                                  </>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[11px] font-black bg-white/20 backdrop-blur-xs">
                                    {leg.line || leg.type}
                                  </span>
                                )}
                              </div>

                              <span className="text-[11px] font-bold opacity-90">
                                {legMin} min
                              </span>
                            </div>

                            <div className="text-[11px] leading-tight truncate mt-1">
                              {isWalk ? (
                                <span className="text-slate-500">
                                  {leg.distanceMeters || 250} m
                                </span>
                              ) : (
                                <span className="opacity-95">
                                  {leg.fromStop.name} &rarr; {leg.toStop.name}
                                </span>
                              )}
                            </div>

                            {/* Delay warning */}
                            {leg.delayMinutes > 0 && (
                              <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-amber-200">
                                <AlertTriangle className="w-3 h-3" />
                                <span>+{leg.delayMinutes} min Verspätung</span>
                              </div>
                            )}
                          </div>

                          {/* Transfer Segment / Umstiegsknoten */}
                          {leg.transferInfo && legIdx < journey.legs.length - 1 && (
                            <div className="p-2 rounded-lg bg-amber-50/90 border border-amber-200 text-amber-950 text-[11px] flex items-center justify-between gap-1 shadow-2xs">
                              <div className="flex items-center gap-1.5 truncate">
                                <ArrowRightLeft className="w-3 h-3 text-amber-600 shrink-0" />
                                <span className="font-bold truncate">
                                  {leg.transferInfo.stationName}
                                </span>
                              </div>
                              <span className="font-extrabold text-amber-800 shrink-0">
                                {Math.round(leg.transferInfo.durationSeconds / 60)} min Umstieg
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Destination Station */}
                  <div className="flex items-center gap-2 text-xs pt-1">
                    <div className="w-3 h-3 rounded-full bg-emerald-600 ring-2 ring-emerald-200 shrink-0"></div>
                    <div className="truncate">
                      <span className="font-bold text-slate-900">
                        {formatTime(journey.arrivalTime)}
                      </span>{' '}
                      <span className="text-slate-600">
                        {journey.legs[journey.legs.length - 1]?.toStop.name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Column Footer Action */}
                <div className="p-2.5 border-t border-slate-200 bg-white text-center">
                  <span
                    className={`text-xs font-bold ${
                      isSelected
                        ? 'text-red-600'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {isSelected ? '✓ Route ausgewählt' : 'Klicken zum Auswählen'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
