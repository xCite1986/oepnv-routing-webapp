import React, { useState } from 'react';
import { Leg } from '../../types/routing';
import { formatTime, formatDuration, formatDistance, getLineColors } from '../../utils/formatters';
import { RealtimeBadge } from '../common/RealtimeBadge';
import { WalkStep } from './WalkStep';
import { TransferStep } from './TransferStep';
import { ChevronDown, ChevronUp, Footprints, Train, Navigation } from 'lucide-react';

interface JourneyLegProps {
  leg: Leg;
  isFirst: boolean;
  isLast: boolean;
  onSelectLeg?: (leg: Leg) => void;
}

export const JourneyLeg: React.FC<JourneyLegProps> = ({ leg, onSelectLeg }) => {
  const [showStops, setShowStops] = useState(false);
  const isWalk = leg.type === 'WALK';
  const colors = getLineColors(leg.line, leg.type);

  if (isWalk) {
    return (
      <div className="relative pl-7 py-2 group cursor-pointer" onClick={() => onSelectLeg?.(leg)}>
        {/* Timeline bar */}
        <div className="absolute left-2.5 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-slate-300" />
        
        {/* Step icon */}
        <div className="absolute left-1 top-3 w-3.5 h-3.5 rounded-full bg-slate-300 ring-4 ring-white flex items-center justify-center">
          <Footprints className="w-2 h-2 text-slate-600" />
        </div>

        <div className="text-xs text-slate-500">
          <div className="font-semibold text-slate-700">
            {formatTime(leg.startTime)} &middot; {leg.fromStop.name}
          </div>
          <div className="py-1">
            <WalkStep
              durationSeconds={leg.durationSeconds}
              distanceMeters={leg.distanceMeters}
              label="Fußweg"
            />
          </div>
          {leg.transferInfo && (
            <TransferStep transfer={leg.transferInfo} />
          )}
        </div>
      </div>
    );
  }

  // ÖPNV Leg (U-Bahn, S-Bahn, Tram, Bus, Regionalzug)
  return (
    <div className="relative pl-7 py-3 group cursor-pointer" onClick={() => onSelectLeg?.(leg)}>
      {/* Colored Timeline vertical line */}
      <div
        className="absolute left-2.5 top-0 bottom-0 w-1 rounded-full transition-all group-hover:w-1.5"
        style={{ backgroundColor: colors.bg }}
      />

      {/* Start stop dot */}
      <div
        className="absolute left-1.5 top-3.5 w-3 h-3 rounded-full ring-4 ring-white shadow-xs"
        style={{ backgroundColor: colors.bg }}
      />

      {/* Content */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs transition-shadow group-hover:shadow-md">
        {/* Header: Times, Line Badge, Realtime Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span
              className="px-2.5 py-0.5 rounded-md text-xs font-bold tracking-wide shadow-xs"
              style={{ backgroundColor: colors.bg, color: colors.text }}
            >
              {leg.line || leg.type}
            </span>
            <span className="text-xs font-medium text-slate-600 truncate max-w-[180px] sm:max-w-xs">
              Richtung {leg.headsign}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">
              {formatDuration(leg.durationSeconds)}
            </span>
            <RealtimeBadge
              status={leg.realtimeStatus}
              delayMinutes={leg.delayMinutes}
              isCancelled={leg.isCancelled}
              disruptionNotice={leg.disruptionNotice}
              size="sm"
            />
          </div>
        </div>

        {/* Departure stop */}
        <div className="flex items-start justify-between text-xs text-slate-800 mb-1">
          <div>
            <span className="font-bold text-slate-900">{formatTime(leg.startTime)}</span>{' '}
            <span className="font-semibold">{leg.fromStop.name}</span>
          </div>
          {leg.fromStop.platform && (
            <span className="text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
              {leg.fromStop.platform}
            </span>
          )}
        </div>

        {/* Intermediate stops collapsible */}
        {leg.stopsCount && leg.stopsCount > 1 && (
          <div className="my-2 border-y border-slate-100 py-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowStops(!showStops);
              }}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
            >
              <Train className="w-3.5 h-3.5 text-slate-400" />
              <span>{leg.stopsCount} Stationen ({formatDuration(leg.durationSeconds)})</span>
              {showStops ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showStops && leg.intermediateStops && (
              <div className="mt-2 pl-4 border-l border-slate-200 space-y-1.5 py-1">
                {leg.intermediateStops.map((stop, sIdx) => (
                  <div key={sIdx} className="flex items-center justify-between text-[11px] text-slate-600">
                    <span>{stop.name}</span>
                    <span className="text-slate-400">{formatTime(stop.scheduledTime)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Disruption Warning Box if any */}
        {leg.disruptionNotice && (
          <div className="my-2 p-2 rounded bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
            <span>{leg.disruptionNotice}</span>
          </div>
        )}

        {/* Arrival stop */}
        <div className="flex items-start justify-between text-xs text-slate-800">
          <div>
            <span className="font-bold text-slate-900">{formatTime(leg.endTime)}</span>{' '}
            <span className="font-semibold">{leg.toStop.name}</span>
          </div>
          {leg.toStop.platform && (
            <span className="text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
              {leg.toStop.platform}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
