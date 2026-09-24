import React from 'react';
import { Journey, Leg } from '../../types/routing';
import { JourneyLeg } from './JourneyLeg';
import { formatTime } from '../../utils/formatters';
import { MapPin, CheckCircle } from 'lucide-react';

interface JourneyTimelineProps {
  journey: Journey;
  onSelectLeg?: (leg: Leg) => void;
}

export const JourneyTimeline: React.FC<JourneyTimelineProps> = ({ journey, onSelectLeg }) => {
  const firstLeg = journey.legs[0];
  const lastLeg = journey.legs[journey.legs.length - 1];

  return (
    <div className="pt-2 pb-1">
      {/* Origin Departure Header */}
      <div className="flex items-center gap-3 pl-1 mb-2">
        <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold ring-4 ring-slate-100">
          <MapPin className="w-3 h-3" />
        </div>
        <div className="text-xs">
          <span className="font-bold text-slate-900">{formatTime(journey.departureTime)}</span>
          <span className="text-slate-500 font-medium"> &middot; Start: {firstLeg?.fromStop.name}</span>
        </div>
      </div>

      {/* Legs List */}
      <div className="space-y-0.5">
        {journey.legs.map((leg, index) => (
          <JourneyLeg
            key={leg.id || `leg-${index}`}
            leg={leg}
            isFirst={index === 0}
            isLast={index === journey.legs.length - 1}
            onSelectLeg={onSelectLeg}
          />
        ))}
      </div>

      {/* Destination Arrival Footer */}
      <div className="flex items-center gap-3 pl-1 mt-2">
        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold ring-4 ring-emerald-100">
          <CheckCircle className="w-3 h-3" />
        </div>
        <div className="text-xs">
          <span className="font-bold text-slate-900">{formatTime(journey.arrivalTime)}</span>
          <span className="text-slate-500 font-medium"> &middot; Ziel: {lastLeg?.toStop.name}</span>
        </div>
      </div>
    </div>
  );
};
