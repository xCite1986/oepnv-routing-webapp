import React from 'react';
import { Journey, Leg } from '../../types/routing';
import { JourneyCard } from './JourneyCard';
import { Radio, AlertCircle, RefreshCw } from 'lucide-react';

interface JourneyResultsProps {
  journeys: Journey[];
  selectedJourneyId?: string;
  isLoading?: boolean;
  error?: string | null;
  realtimeActive?: boolean;
  disruptionSummary?: string;
  onSelectJourney?: (journey: Journey) => void;
  onSelectLeg?: (leg: Leg) => void;
  onShowOnMap?: (journey: Journey) => void;
  onRetry?: () => void;
}

export const JourneyResults: React.FC<JourneyResultsProps> = ({
  journeys,
  selectedJourneyId,
  isLoading = false,
  error,
  realtimeActive = true,
  disruptionSummary,
  onSelectJourney,
  onSelectLeg,
  onShowOnMap,
  onRetry,
}) => {
  if (isLoading) {
    return (
      <div className="py-12 px-4 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-3 animate-spin">
          <RefreshCw className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">
          Suche aktuelle Verbindungen …
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          Echtzeitdaten, Verspätungen und aktuelle Störungen werden analysiert.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center my-4">
        <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-2">
          <AlertCircle className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-rose-900 mb-1">
          Verbindungssuche nicht möglich
        </h3>
        <p className="text-xs text-rose-700 max-w-sm mx-auto mb-4">
          {error}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors"
          >
            Erneut versuchen
          </button>
        )}
      </div>
    );
  }

  if (!journeys || journeys.length === 0) {
    return (
      <div className="py-12 px-4 text-center bg-white rounded-2xl border border-slate-200 my-4">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-2">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">
          Aktuell konnte keine passende Verbindung gefunden werden.
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          Bitte prüfe Start- und Zielort oder passe die Abfahrtszeit an.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Realtime Status Indicator Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-900 text-white shadow-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold">
            {realtimeActive ? 'Live-Echtzeit aktiv' : 'Fahrplanmodus'}
          </span>
          <span className="text-xs text-slate-300 hidden sm:inline">&middot; Wien & Umgebung</span>
        </div>

        {disruptionSummary && (
          <div className="text-[11px] text-amber-300 line-clamp-1 max-w-md">
            {disruptionSummary}
          </div>
        )}
      </div>

      {/* Journey Cards List */}
      <div className="space-y-3">
        {journeys.map((journey) => (
          <JourneyCard
            key={journey.id}
            journey={journey}
            isSelected={journey.id === selectedJourneyId}
            onSelectJourney={onSelectJourney}
            onSelectLeg={onSelectLeg}
            onShowOnMap={onShowOnMap}
          />
        ))}
      </div>
    </div>
  );
};
