import React, { useState } from 'react';
import { LocationPoint, TimeMode, JourneySearchRequest } from '../../types/routing';
import { LocationInput } from './LocationInput';
import { DateTimeSelector } from './DateTimeSelector';
import { VIENNA_LOCATIONS } from '../../api/viennaLocations';
import { ArrowUpDown, Search, SlidersHorizontal } from 'lucide-react';

interface SearchFormProps {
  onSearch: (request: JourneySearchRequest) => void;
  isLoading?: boolean;
}

export const SearchForm: React.FC<SearchFormProps> = ({ onSearch, isLoading = false }) => {
  // Standard-Prefill nach §33: Stephansplatz -> Flughafen Wien
  const [origin, setOrigin] = useState<LocationPoint | null>(VIENNA_LOCATIONS[0]); // Stephansplatz
  const [destination, setDestination] = useState<LocationPoint | null>(VIENNA_LOCATIONS[1]); // Flughafen Wien
  const [timeMode, setTimeMode] = useState<TimeMode>('NOW');
  const [dateTime, setDateTime] = useState<string>(new Date().toISOString());
  const [maxWalking, setMaxWalking] = useState<number>(1500);
  const [showPreferences, setShowPreferences] = useState<boolean>(false);

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination) {
      alert('Bitte wähle Start und Zielort aus.');
      return;
    }

    const request: JourneySearchRequest = {
      from: origin,
      to: destination,
      dateTime: timeMode === 'NOW' ? new Date().toISOString() : dateTime,
      timeMode: timeMode === 'ARRIVAL' ? 'ARRIVAL' : 'DEPARTURE',
      preferences: {
        maxWalkingDistance: maxWalking,
        maxTransfers: 6,
        optimization: 'FASTEST',
      },
    };

    onSearch(request);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4"
    >
      {/* Location Inputs with Swap Button */}
      <div className="relative space-y-3">
        <LocationInput
          id="origin-input"
          label="Von"
          placeholder="Start (z.B. Stephansplatz)"
          value={origin}
          onChange={setOrigin}
          icon="origin"
        />

        {/* Swap button placed between inputs */}
        <div className="absolute right-4 top-[48px] z-10">
          <button
            type="button"
            onClick={handleSwap}
            aria-label="Start und Ziel tauschen"
            className="p-2 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-300 shadow-xs transition-all active:scale-95"
            title="Start und Ziel tauschen"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>

        <LocationInput
          id="destination-input"
          label="Nach"
          placeholder="Ziel (z.B. Flughafen Wien)"
          value={destination}
          onChange={setDestination}
          icon="destination"
        />
      </div>

      {/* Date & Time selection */}
      <DateTimeSelector
        timeMode={timeMode}
        selectedDateTime={dateTime}
        onChangeMode={setTimeMode}
        onChangeDateTime={setDateTime}
      />

      {/* Optional Preferences Accordion */}
      <div>
        <button
          type="button"
          onClick={() => setShowPreferences(!showPreferences)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Optionen (max. Fußweg)</span>
        </button>

        {showPreferences && (
          <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-700">
              <span>Maximaler Fußweg:</span>
              <span className="font-bold">{maxWalking} m</span>
            </div>
            <input
              type="range"
              min="300"
              max="3000"
              step="100"
              value={maxWalking}
              onChange={(e) => setMaxWalking(Number(e.target.value))}
              className="w-full accent-red-600 cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Primary Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !origin || !destination}
        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:opacity-50 text-white font-bold text-sm tracking-wide shadow-md shadow-red-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <Search className="w-4 h-4" />
        <span>{isLoading ? 'Verbindungen suchen …' : 'Verbindungen suchen'}</span>
      </button>
    </form>
  );
};
