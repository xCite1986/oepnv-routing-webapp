import React, { useState, useEffect } from 'react';
import { Journey, IncidentAlert } from '../../types/routing';
import { TransitApiClient } from '../../api/client';
import { getLineColors, formatDisruptionTime } from '../../utils/formatters';
import {
  X,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Radio,
  Train,
  Sparkles,
  RefreshCw,
  Clock,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

interface DisruptionsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedJourney?: Journey | null;
  disruptionSummary?: string;
}

export const DisruptionsSidebar: React.FC<DisruptionsSidebarProps> = ({
  isOpen,
  onClose,
  selectedJourney,
  disruptionSummary,
}) => {
  const [incidents, setIncidents] = useState<IncidentAlert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadIncidents = async () => {
    setIsLoading(true);
    try {
      const data = await TransitApiClient.getIncidents();
      setIncidents(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadIncidents();
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Linien der aktuell ausgewählten Route ermitteln
  const journeyTransitLegs = selectedJourney?.legs.filter((l) => l.type !== 'WALK' && l.line) || [];
  const journeyLines = Array.from(new Set(journeyTransitLegs.map((l) => l.line!)));

  // Störungen aufteilen: Welche betreffen die Route, welche die Umgebung?
  const routeIncidents = incidents.filter((inc) => {
    const matchesLine = inc.lines.some((l) => journeyLines.includes(l));
    const isStammstrecke =
      (inc.title.includes('Stammstrecke') || inc.description.includes('Stammstrecke')) &&
      journeyLines.some((l) => l.startsWith('S') || l.startsWith('REX'));
    return matchesLine || isStammstrecke;
  });

  const otherIncidents = incidents.filter((inc) => !routeIncidents.includes(inc));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-8 sm:pl-12">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200 transform transition-transform duration-300 ease-in-out animate-in slide-in-from-right">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Störungen &amp; Verkehrslage
                  </h3>
                  <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Live
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Echtzeitmeldungen für deine Verbindung &amp; Wien
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Sidebar schließen (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
            {/* Section 1: Auswirkungen auf die aktuell gewählte Route */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                  <span>Auswirkung auf gewählte Route</span>
                </h4>
                {selectedJourney && (
                  <span className="text-[11px] font-semibold text-slate-600">
                    {journeyLines.join(' + ') || 'Direkt'}
                  </span>
                )}
              </div>

              {selectedJourney ? (
                routeIncidents.length > 0 ? (
                  <div className="space-y-3">
                    {routeIncidents.map((inc) => (
                      <div
                        key={inc.id}
                        className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/90 via-rose-50/60 to-red-50/80 border border-amber-300 text-slate-800 shadow-xs"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-amber-500 text-slate-950">
                            Betrifft deine Strecke
                          </span>
                          <div className="flex gap-1">
                            {inc.lines.map((line) => {
                              const colors = getLineColors(line);
                              return (
                                <span
                                  key={line}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                                  style={{ backgroundColor: colors.bg, color: colors.text }}
                                >
                                  {line}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        <div className="font-bold text-sm text-slate-900 mb-1">
                          {inc.title}
                        </div>

                        {inc.validFrom && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-2.5 rounded-lg bg-amber-100/90 border border-amber-300 text-xs font-semibold text-amber-950 shadow-2xs">
                            <Clock className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                            <span>Störungsbeginn: {formatDisruptionTime(inc.validFrom)}</span>
                            {inc.validTo && (
                              <span className="text-amber-800 font-normal">
                                &middot; Bis voraussichtlich {formatDisruptionTime(inc.validTo)}
                              </span>
                            )}
                          </div>
                        )}

                        <p className="text-xs text-slate-700 leading-relaxed">
                          {inc.description}
                        </p>

                        <div className="mt-3 pt-2.5 border-t border-amber-200/80 flex items-center gap-1.5 text-[11px] font-medium text-amber-900">
                          <Sparkles className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          <span>
                            WienMobil Routing empfiehlt bereits eine Ausweichroute, um diesen Engpass zu umgehen.
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-emerald-950">
                        Keine Störungen auf deiner gewählten Route
                      </div>
                      <p className="text-xs text-emerald-800 mt-0.5">
                        Für die Linien {journeyLines.join(', ') || 'dieser Verbindung'} liegen aktuell keine Verzögerungsmeldungen vor.
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-500 text-center">
                  Wähle links eine Route aus, um streckenspezifische Auswirkungen zu prüfen.
                </div>
              )}
            </div>

            {/* Section 2: Alle aktuellen Meldungen in Wien & Umgebung */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-slate-500" />
                  <span>Alle Meldungen (Wien &amp; Umgebung)</span>
                </h4>
                <span className="text-[11px] text-slate-400 font-medium">
                  {incidents.length} aktiv
                </span>
              </div>

              {isLoading ? (
                <div className="p-8 text-center text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-500" />
                  <span className="text-xs">Aktualisiere Echtzeitmeldungen...</span>
                </div>
              ) : incidents.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
                  Aktuell keine Störungen im Wiener Netz gemeldet.
                </div>
              ) : (
                <div className="space-y-3">
                  {incidents.map((inc) => (
                    <div
                      key={inc.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                            inc.severity === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800'
                              : inc.severity === 'WARNING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {inc.severity === 'CRITICAL'
                            ? 'Kritisch'
                            : inc.severity === 'WARNING'
                            ? 'Warnung'
                            : 'Info'}
                        </span>

                        <div className="flex gap-1 flex-wrap">
                          {inc.lines.map((line) => {
                            const colors = getLineColors(line);
                            return (
                              <span
                                key={line}
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                                style={{ backgroundColor: colors.bg, color: colors.text }}
                              >
                                {line}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      <div className="text-xs font-bold text-slate-900 mb-1">
                        {inc.title}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {inc.description}
                      </p>

                      <div className="mt-2.5 pt-2 border-t border-slate-200/70 text-[10px] text-slate-500 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700">
                          <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>
                            {inc.validFrom ? `Beginn: ${formatDisruptionTime(inc.validFrom)}` : 'Meldung aktiv'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Wiener Linien / ÖBB Live
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer Info */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-medium text-slate-600">
                Live-Schnittstellen aktiv
              </span>
            </div>

            <button
              type="button"
              onClick={loadIncidents}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Aktualisieren</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
