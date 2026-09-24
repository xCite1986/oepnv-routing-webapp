import React from 'react';
import { Journey } from '../../types/routing';
import { formatTime, formatDuration, getLineColors } from '../../utils/formatters';
import { exportJourneyAsGraphic } from '../../utils/exportRouteGraphic';
import {
  Download,
  BarChart2,
  Footprints,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  X,
  ShieldCheck,
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
  // Falls keine Route explizit ausgewählt ist, ist die empfohlene bzw. erste Route aktiv
  const activeJourney = selectedJourney || journeys[0] || null;

  const handleDownload = () => {
    if (!activeJourney) return;
    const title = activeJourney.tagLabel
      ? `Route: ${activeJourney.tagLabel}`
      : 'WienMobil Route';
    exportJourneyAsGraphic(activeJourney, title);
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
          Starte links eine Verbindungssuche, um gefundene Routen, Fahrzeiten und Umstiege grafisch im vertikalen Gantt-Chart zu vergleichen.
        </p>
      </div>
    );
  }

  const hasSelection = Boolean(selectedJourney);

  // 1. Skalierung für das vertikale Gantt-Chart berechnen
  const durationsMin = journeys.map((j) => Math.max(1, Math.round(j.durationSeconds / 60)));
  const maxDurationMin = Math.max(...durationsMin, 30);

  // Intervall für die Y-Achsen-Zeitteilung (10, 15, 30 oder 60 Minuten)
  let tickStep = 15;
  if (maxDurationMin <= 30) tickStep = 10;
  else if (maxDurationMin <= 90) tickStep = 15;
  else if (maxDurationMin <= 180) tickStep = 30;
  else tickStep = 60;

  const maxAxisMin = Math.ceil(maxDurationMin / tickStep) * tickStep;

  // Pixels pro Minute (dynamische Höhe: ca. 240px bis 320px)
  const pxPerMin = Math.max(2.0, Math.min(5.5, 270 / maxAxisMin));
  const chartHeightPx = Math.round(maxAxisMin * pxPerMin);

  // Zeitmarkierungen (Ticks) generieren: 0, 15, 30, 45, ...
  const axisTicks: number[] = [];
  for (let t = 0; t <= maxAxisMin; t += tickStep) {
    axisTicks.push(t);
  }

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
          {activeJourney && (
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

      {/* Main Content Area: Scrollable Container with Gantt Chart + Route Details */}
      <div className="flex-1 overflow-y-auto p-2.5 sm:p-4 space-y-4 bg-slate-100/70">
        
        {/* 1. Vertikales Gantt-Diagramm */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-2.5 sm:p-4">
          {/* Gantt Area with Y-Axis Time Scale & Columns */}
          <div className="overflow-x-auto pb-2">
            <div className="flex items-start gap-1 sm:gap-1.5 w-full">
              {/* Y-Axis Time Scale Ruler (Links) */}
              <div
                className="w-8 sm:w-10 shrink-0 flex flex-col justify-between select-none relative pt-24"
                style={{ height: `${chartHeightPx + 110}px` }}
              >
                {axisTicks.map((tick) => {
                  const topPx = 95 + Math.round(tick * pxPerMin);
                  return (
                    <div
                      key={`axis-${tick}`}
                      className="absolute right-1 flex items-center gap-0.5 -translate-y-1/2"
                      style={{ top: `${topPx}px` }}
                    >
                      <span className="text-[9px] sm:text-[10px] font-bold text-slate-400">
                        {tick}m
                      </span>
                      <div className="w-1.5 h-[1.5px] bg-slate-300" />
                    </div>
                  );
                })}
              </div>

              {/* Gantt Columns Container with subtle background grid lines */}
              <div className="relative flex-1 flex items-start gap-1 sm:gap-2 w-full">
                {/* Horizontal Guideline Dashes across columns for each tick */}
                {axisTicks.map((tick) => {
                  const topPx = 95 + Math.round(tick * pxPerMin);
                  return (
                    <div
                      key={`grid-${tick}`}
                      className="absolute left-0 right-0 border-t border-dashed border-slate-200 pointer-events-none z-0"
                      style={{ top: `${topPx}px` }}
                    />
                  );
                })}

                {/* Vertical Gantt Columns (one per journey) */}
                {journeys.map((journey, journeyIdx) => {
                  const isSelected = selectedJourney?.id === journey.id;
                  const isDimmed = hasSelection && !isSelected;
                  const durationMin = Math.round(journey.durationSeconds / 60);

                  // Berechne proportionale Gesamthöhe des Gantt-Balkens
                  const targetBarHeight = Math.round(durationMin * pxPerMin);

                  // Mindesthöhe sicherstellen, damit jeder Abschnitt lesbar bleibt
                  const minLegsHeight = journey.legs.reduce((acc, leg) => {
                    const isWalk = leg.type === 'WALK';
                    const hasTransfer = Boolean(leg.transferInfo);
                    return acc + (isWalk ? 24 : 32) + (hasTransfer ? 22 : 0);
                  }, 24);

                  const barHeight = Math.max(minLegsHeight, targetBarHeight);

                  return (
                    <div
                      key={journey.id || journeyIdx}
                      onClick={() => onSelectJourney?.(journey)}
                      className={`flex-1 min-w-[55px] sm:min-w-[65px] max-w-[220px] rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col z-10 relative overflow-hidden ${
                        isSelected
                          ? 'bg-white border-red-500 ring-2 ring-red-400/40 shadow-md opacity-100'
                          : isDimmed
                          ? 'bg-slate-50/70 border-slate-200 opacity-40 grayscale-[25%] hover:opacity-85 hover:border-slate-300'
                          : 'bg-white border-slate-200 shadow-2xs hover:border-red-300 hover:shadow-md opacity-100'
                      }`}
                    >
                      {/* Compact Column Header */}
                      <div
                        className={`p-1.5 sm:p-2.5 border-b text-center transition-colors ${
                          isSelected
                            ? 'bg-gradient-to-b from-red-50 via-rose-50 to-white border-red-200'
                            : 'bg-slate-50/80 border-slate-200'
                        }`}
                      >
                        <span
                          className={`inline-block text-[8px] sm:text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full mb-1 truncate max-w-full ${
                            journey.recommended
                              ? 'bg-red-600 text-white shadow-2xs'
                              : journey.categoryTag === 'DIREKTER'
                              ? 'bg-slate-800 text-white'
                              : 'bg-slate-200 text-slate-800'
                          }`}
                        >
                          {journey.tagLabel || `Opt. ${journeyIdx + 1}`}
                        </span>

                        {/* Total Duration Display (Crucial for test assertion e.g. "39 min") */}
                        <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none mt-0.5 whitespace-nowrap">
                          {durationMin} min
                        </div>

                        {/* Departure & Arrival Times */}
                        <div className="text-[9px] sm:text-[10px] text-slate-500 font-semibold mt-1 whitespace-nowrap">
                          {formatTime(journey.departureTime)} &rarr; {formatTime(journey.arrivalTime)}
                        </div>

                        {/* Transfers count */}
                        <div className="text-[8px] sm:text-[9px] text-slate-400 mt-0.5 whitespace-nowrap truncate">
                          {journey.transferCount === 0
                            ? 'Direktfahrt'
                            : `${journey.transferCount} ${journey.transferCount === 1 ? 'Umstieg' : 'Umst.'}`}
                        </div>
                      </div>

                      {/* Proportional Vertical Gantt Bar Area */}
                      <div className="p-1.5 sm:p-2.5 flex flex-col items-center justify-start bg-slate-50/40">
                        {/* Start Station Dot */}
                        <div className="flex items-center justify-center gap-1 text-[8px] sm:text-[9px] font-bold text-slate-700 mb-1 max-w-full px-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-800 shrink-0" />
                          <span className="truncate">{journey.legs[0]?.fromStop.name}</span>
                        </div>

                        {/* Stacked Vertical Gantt Bar */}
                        <div
                          style={{ height: `${barHeight}px` }}
                          className="w-11 sm:w-14 md:w-16 rounded-xl border border-slate-300/80 shadow-xs overflow-hidden flex flex-col transition-all my-1 shrink-0"
                        >
                          {journey.legs.map((leg, legIdx) => {
                            const isWalk = leg.type === 'WALK';
                            const legMin = Math.round(leg.durationSeconds / 60);
                            const colors = getLineColors(leg.line, leg.type);
                            const legWeight = Math.max(1, leg.durationSeconds);

                            return (
                              <React.Fragment key={leg.id || legIdx}>
                                {/* Transit or Walk Segment */}
                                <div
                                  style={{
                                    flex: `${legWeight} 1 0%`,
                                    backgroundColor: isWalk ? '#f1f5f9' : colors.bg,
                                    color: isWalk ? '#475569' : colors.text,
                                    minHeight: isWalk ? '22px' : '30px',
                                  }}
                                  className={`flex flex-col items-center justify-center p-1 text-center border-b border-black/10 last:border-b-0 transition-transform ${
                                    isWalk ? 'border-dashed border-slate-300' : ''
                                  }`}
                                  title={`${leg.line || 'Fußweg'}: ${leg.fromStop.name} → ${leg.toStop.name} (${legMin} min)`}
                                >
                                  {isWalk ? (
                                    <div className="flex items-center justify-center gap-1 leading-none">
                                      <Footprints className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                      <span className="text-[10px] font-bold text-slate-600">
                                        {legMin}m
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center justify-center leading-none">
                                      <span className="text-[11px] font-black tracking-tight drop-shadow-xs truncate max-w-full">
                                        {leg.line || leg.type}
                                      </span>
                                      <span className="text-[9px] font-bold opacity-90 mt-0.5">
                                        {legMin}m
                                      </span>
                                      {leg.delayMinutes > 0 && (
                                        <span className="text-[8px] font-black bg-amber-400 text-amber-950 rounded px-1 mt-0.5">
                                          +{leg.delayMinutes}m
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Transfer Buffer Segment between legs */}
                                {leg.transferInfo && legIdx < journey.legs.length - 1 && (
                                  <div
                                    style={{
                                      minHeight: '20px',
                                    }}
                                    className="bg-amber-100 border-y border-amber-300 flex items-center justify-center px-1 text-amber-900 shrink-0"
                                    title={`Umstieg: ${leg.transferInfo.stationName} (${Math.round(leg.transferInfo.durationSeconds / 60)} min)`}
                                  >
                                    <ArrowRightLeft className="w-2.5 h-2.5 text-amber-700 mr-0.5 shrink-0" />
                                    <span className="text-[8px] font-black leading-none">
                                      {Math.round(leg.transferInfo.durationSeconds / 60)}m
                                    </span>
                                  </div>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>

                        {/* Destination Station Dot */}
                        <div className="flex items-center justify-center gap-1 text-[8px] sm:text-[9px] font-bold text-slate-700 mt-1 max-w-full px-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                          <span className="truncate">
                            {journey.legs[journey.legs.length - 1]?.toStop.name}
                          </span>
                        </div>
                      </div>

                      {/* Clickable Column Footer */}
                      <div className="p-1 sm:p-1.5 border-t border-slate-100 bg-white text-center mt-auto flex items-center justify-center min-h-[28px]">
                        {isSelected ? (
                          <div className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-extrabold text-red-700 bg-red-100/90 px-2 py-0.5 rounded-full whitespace-nowrap">
                            <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                            <span>Gewählt</span>
                          </div>
                        ) : (
                          <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400 group-hover:text-slate-700 whitespace-nowrap">
                            Auswählen
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Detailansicht der ausgewählten Route (Haltestellen, Gleise & Umstiege) */}
        {activeJourney && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Ausgewählte Route im Detail
                  </span>
                  {activeJourney.tagLabel && (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                      {activeJourney.tagLabel}
                    </span>
                  )}
                </div>
                <div className="text-sm font-black text-slate-900 mt-0.5">
                  {activeJourney.legs[0]?.fromStop.name} &rarr;{' '}
                  {activeJourney.legs[activeJourney.legs.length - 1]?.toStop.name}
                </div>
              </div>

              <div className="text-right">
                <div className="text-lg font-black text-slate-900 leading-tight">
                  {Math.round(activeJourney.durationSeconds / 60)} min
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  {formatTime(activeJourney.departureTime)} bis {formatTime(activeJourney.arrivalTime)} Uhr
                </div>
              </div>
            </div>

            {/* Vertical Detailed Itinerary */}
            <div className="space-y-3 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {/* Origin Stop */}
              <div className="relative flex items-start gap-3 pl-1">
                <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 z-10 shadow-xs">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {activeJourney.legs[0]?.fromStop.name}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-900 shrink-0">
                      {formatTime(activeJourney.departureTime)} Uhr
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">Start der Reise</span>
                </div>
              </div>

              {/* Legs in sequence */}
              {activeJourney.legs.map((leg, idx) => {
                const isWalk = leg.type === 'WALK';
                const colors = getLineColors(leg.line, leg.type);
                const legMin = Math.round(leg.durationSeconds / 60);

                return (
                  <React.Fragment key={leg.id || idx}>
                    <div className="relative flex items-start gap-3 pl-1 group">
                      {/* Line badge / Walk badge */}
                      <div
                        style={
                          isWalk
                            ? undefined
                            : { backgroundColor: colors.bg, color: colors.text }
                        }
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 z-10 shadow-xs font-bold text-xs ${
                          isWalk
                            ? 'bg-slate-100 border border-dashed border-slate-400 text-slate-700'
                            : ''
                        }`}
                      >
                        {isWalk ? (
                          <Footprints className="w-4 h-4 text-slate-600" />
                        ) : (
                          <span className="text-[11px] font-black leading-none">
                            {leg.line || leg.type}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        {isWalk ? (
                          <div>
                            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                              <span>Fußweg ({leg.distanceMeters || 200} m)</span>
                              <span className="font-mono text-slate-600">{legMin} min</span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {leg.fromStop.name} &rarr; {leg.toStop.name}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {leg.fromStop.name} &rarr; {leg.toStop.name}
                              </span>
                              <span className="font-mono text-xs font-bold text-slate-900 shrink-0">
                                {legMin} min
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                              {leg.headsign && (
                                <span>Richtung {leg.headsign}</span>
                              )}
                              {leg.stopsCount ? (
                                <span>&bull; {leg.stopsCount} Zwischenstationen</span>
                              ) : null}
                              {leg.fromStop.platform && (
                                <span className="font-mono text-slate-600 font-semibold">
                                  [{leg.fromStop.platform}]
                                </span>
                              )}
                            </div>

                            {leg.delayMinutes > 0 && (
                              <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                <span>+{leg.delayMinutes} min Verspätung eingerechnet</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Transfer station */}
                    {leg.transferInfo && idx < activeJourney.legs.length - 1 && (
                      <div className="relative flex items-center gap-3 pl-1">
                        <div className="w-5 h-5 rounded-full bg-amber-400 border border-amber-600 text-amber-950 flex items-center justify-center shrink-0 z-10 shadow-xs">
                          <ArrowRightLeft className="w-3 h-3" />
                        </div>
                        <div className="min-w-0 flex-1 py-1 px-2.5 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                          <span className="font-semibold">
                            Umstieg am {leg.transferInfo.stationName}{' '}
                            <span className="font-normal text-amber-700">
                              ({leg.transferInfo.difficultyLabel})
                            </span>
                          </span>
                          <span className="font-bold">
                            {Math.round(leg.transferInfo.durationSeconds / 60)} min Puffer
                          </span>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}

              {/* Destination Stop */}
              <div className="relative flex items-start gap-3 pl-1">
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 z-10 shadow-xs">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {activeJourney.legs[activeJourney.legs.length - 1]?.toStop.name}
                    </span>
                    <span className="font-mono text-xs font-bold text-emerald-700 shrink-0">
                      {formatTime(activeJourney.arrivalTime)} Uhr
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">Ziel erreicht</span>
                </div>
              </div>
            </div>

            {/* Quick summary strip */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Zuverlässigkeit: <strong>{activeJourney.reliabilityPercent || 95}%</strong></span>
                </span>
                <span>
                  Fußweg gesamt: <strong>{formatDuration(activeJourney.walkingSeconds)}</strong>
                </span>
              </div>

              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-bold hover:underline cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Als Grafik-Bild speichern</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
