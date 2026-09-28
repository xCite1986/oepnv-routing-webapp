import React, { useState } from 'react';
import { LocationPoint, TimeMode, JourneySearchRequest, TransferSpeed } from '../../types/routing';
import { LocationInput } from './LocationInput';
import { DateTimeSelector } from './DateTimeSelector';
import { VIENNA_LOCATIONS } from '../../api/viennaLocations';
import { ArrowUpDown, Search, SlidersHorizontal, Accessibility, Footprints, Zap } from 'lucide-react';

interface SearchFormProps {
  onSearch: (request: JourneySearchRequest) => void;
  isLoading?: boolean;
  origin?: LocationPoint | null;
  destination?: LocationPoint | null;
  timeMode?: TimeMode;
  dateTime?: string;
  maxWalking?: number;
  transferSpeed?: TransferSpeed;
  onChangeOrigin?: (origin: LocationPoint | null) => void;
  onChangeDestination?: (destination: LocationPoint | null) => void;
  onChangeTimeMode?: (mode: TimeMode) => void;
  onChangeDateTime?: (dt: string) => void;
  onChangeMaxWalking?: (maxWalking: number) => void;
  onChangeTransferSpeed?: (speed: TransferSpeed) => void;
}

export const SearchForm: React.FC<SearchFormProps> = ({
  onSearch,
  isLoading = false,
  origin: propOrigin,
  destination: propDestination,
  timeMode: propTimeMode,
  dateTime: propDateTime,
  maxWalking: propMaxWalking,
  transferSpeed: propTransferSpeed,
  onChangeOrigin,
  onChangeDestination,
  onChangeTimeMode,
  onChangeDateTime,
  onChangeMaxWalking,
  onChangeTransferSpeed,
}) => {
  // Keine automatische Vorbelegung mit Stephansplatz/Flughafen (Start leer)
  const [internalOrigin, setInternalOrigin] = useState<LocationPoint | null>(null);
  const [internalDestination, setInternalDestination] = useState<LocationPoint | null>(null);
  const [internalTimeMode, setInternalTimeMode] = useState<TimeMode>('NOW');
  const [internalDateTime, setInternalDateTime] = useState<string>(new Date().toISOString());
  const [internalMaxWalking, setInternalMaxWalking] = useState<number>(1500);
  const [internalTransferSpeed, setInternalTransferSpeed] = useState<TransferSpeed>('NORMAL');

  const origin = propOrigin !== undefined ? propOrigin : internalOrigin;
  const destination = propDestination !== undefined ? propDestination : internalDestination;
  const timeMode = propTimeMode !== undefined ? propTimeMode : internalTimeMode;
  const dateTime = propDateTime !== undefined ? propDateTime : internalDateTime;
  const maxWalking = propMaxWalking !== undefined ? propMaxWalking : internalMaxWalking;
  const transferSpeed = propTransferSpeed !== undefined ? propTransferSpeed : internalTransferSpeed;

  const setOrigin = (val: LocationPoint | null) => {
    if (onChangeOrigin) onChangeOrigin(val);
    else setInternalOrigin(val);
  };
  const setDestination = (val: LocationPoint | null) => {
    if (onChangeDestination) onChangeDestination(val);
    else setInternalDestination(val);
  };
  const setTimeMode = (val: TimeMode) => {
    if (onChangeTimeMode) onChangeTimeMode(val);
    else setInternalTimeMode(val);
  };
  const setDateTime = (val: string) => {
    if (onChangeDateTime) onChangeDateTime(val);
    else setInternalDateTime(val);
  };
  const setMaxWalking = (val: number) => {
    if (onChangeMaxWalking) onChangeMaxWalking(val);
    else setInternalMaxWalking(val);
  };
  const setTransferSpeed = (val: TransferSpeed) => {
    if (onChangeTransferSpeed) onChangeTransferSpeed(val);
    else setInternalTransferSpeed(val);
  };

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
        transferSpeed: transferSpeed,
        wheelchair: transferSpeed === 'SLOW',
        alpha: transferSpeed === 'SLOW' ? 1.5 : transferSpeed === 'FAST' ? 0.7 : 1.0,
        beta: transferSpeed === 'SLOW' ? 1.6 : transferSpeed === 'FAST' ? 0.6 : 1.0,
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
          placeholder="Start (Haltestelle oder Adresse)"
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
            className="p-2 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-300 shadow-xs transition-all active:scale-95 cursor-pointer"
            title="Start und Ziel tauschen"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>

        <LocationInput
          id="destination-input"
          label="Nach"
          placeholder="Ziel (Haltestelle oder Adresse)"
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

      {/* Optionen (dauerhaft eingeblendet, ohne "(max. Fußweg)") */}
      <div className="pt-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-red-600" />
          <span>Optionen</span>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3">
          {/* Geschwindigkeitsprofil für Umstiege */}
          <div>
            <div className="flex items-center justify-between text-slate-700 mb-1.5">
              <span className="font-semibold">Umstiegs- &amp; Gehgeschwindigkeit:</span>
              <span className="font-bold text-red-700">
                {transferSpeed === 'SLOW' ? 'Langsam' : transferSpeed === 'FAST' ? 'Schnell' : 'Normal'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setTransferSpeed('SLOW')}
                className={`py-2 px-1.5 rounded-lg text-xs font-semibold transition-all flex flex-col items-center justify-center gap-0.5 border text-center cursor-pointer ${
                  transferSpeed === 'SLOW'
                    ? 'bg-red-50 text-red-700 border-red-300 ring-1 ring-red-400 font-bold shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title="Langsam: z.B. Rollstuhlfahrer, Reisende mit Gepäck oder Mobilitätseinschränkung"
              >
                <span className="flex items-center gap-1">
                  <Accessibility className="w-3.5 h-3.5" />
                  <span>Langsam</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Gepäck / Rollstuhl
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTransferSpeed('NORMAL')}
                className={`py-2 px-1.5 rounded-lg text-xs font-semibold transition-all flex flex-col items-center justify-center gap-0.5 border text-center cursor-pointer ${
                  transferSpeed === 'NORMAL'
                    ? 'bg-red-50 text-red-700 border-red-300 ring-1 ring-red-400 font-bold shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title="Normal: Standard-Gehtempo und reguläre Pufferzeiten"
              >
                <span className="flex items-center gap-1">
                  <Footprints className="w-3.5 h-3.5" />
                  <span>Normal</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Standardtempo
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTransferSpeed('FAST')}
                className={`py-2 px-1.5 rounded-lg text-xs font-semibold transition-all flex flex-col items-center justify-center gap-0.5 border text-center cursor-pointer ${
                  transferSpeed === 'FAST'
                    ? 'bg-red-50 text-red-700 border-red-300 ring-1 ring-red-400 font-bold shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title="Schnell: Routinierte, jüngere Personen ohne Mobilitätseinschränkung"
              >
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Schnell</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Routiniert
                </span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500 mt-1.5 leading-tight">
              {transferSpeed === 'SLOW' && 'Großzügige Puffer & sichere Anschlüsse für Gepäck oder Rollstuhl.'}
              {transferSpeed === 'NORMAL' && 'Reguläre Umstiegszeiten im Wiener Verkehrsnetz.'}
              {transferSpeed === 'FAST' && 'Sportliches Tempo – nutzt auch knappe, schnelle Anschlüsse.'}
            </p>
          </div>

          {/* Maximaler Fußweg */}
          <div className="pt-2 border-t border-slate-200/70">
            <div className="flex items-center justify-between text-slate-700 mb-1">
              <span className="font-semibold">Maximaler Fußweg:</span>
              <span className="font-bold text-slate-900">{maxWalking} m</span>
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
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>300 m (4 min)</span>
              <span>1.500 m</span>
              <span>3.000 m (35 min)</span>
            </div>
          </div>
        </div>
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
