import React, { useState, useEffect, useRef } from 'react';
import { LocationPoint } from '../../types/routing';
import { TransitApiClient } from '../../api/client';
import { MapPin, Navigation, X, Search, Train, Building, Crosshair } from 'lucide-react';

interface LocationInputProps {
  id: string;
  label: string;
  placeholder: string;
  value: LocationPoint | null;
  onChange: (location: LocationPoint | null) => void;
  icon?: 'origin' | 'destination';
}

export const LocationInput: React.FC<LocationInputProps> = ({
  id,
  label,
  placeholder,
  value,
  onChange,
  icon = 'origin',
}) => {
  const [inputValue, setInputValue] = useState<string>(value?.label || '');
  const [suggestions, setSuggestions] = useState<LocationPoint[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal text when value prop changes externally
  useEffect(() => {
    setInputValue(value?.label || '');
  }, [value]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions with debouncing
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await TransitApiClient.searchLocations(inputValue);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [inputValue, isOpen]);

  const handleSelect = (loc: LocationPoint) => {
    setInputValue(loc.label);
    onChange(loc);
    setIsOpen(false);
  };

  const handleClear = () => {
    setInputValue('');
    onChange(null);
    setIsOpen(true);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Standortermittlung wird von deinem Browser nicht unterstützt.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const currentLoc: LocationPoint = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          label: 'Aktueller Standort',
          type: 'CURRENT_LOCATION',
        };
        handleSelect(currentLoc);
      },
      () => {
        // Fallback für Tests: Stephansplatz als Standort
        const fallbackLoc: LocationPoint = {
          lat: 48.20849,
          lon: 16.37208,
          label: 'Aktueller Standort (Stephansplatz)',
          type: 'CURRENT_LOCATION',
        };
        handleSelect(fallbackLoc);
      },
      { timeout: 5000 }
    );
  };

  const renderSuggestionIcon = (type?: string) => {
    if (type === 'STATION' || type === 'STOP') {
      return <Train className="w-4 h-4 text-red-600 shrink-0" />;
    }
    if (type === 'CURRENT_LOCATION') {
      return <Crosshair className="w-4 h-4 text-blue-600 shrink-0" />;
    }
    return <Building className="w-4 h-4 text-slate-400 shrink-0" />;
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <label htmlFor={id} className="block text-xs font-bold text-slate-600 mb-1 tracking-wide">
        {label}
      </label>

      <div className="relative flex items-center">
        <div className="absolute left-3 pointer-events-none">
          {icon === 'origin' ? (
            <div className="w-3.5 h-3.5 rounded-full border-2 border-red-600 bg-white" />
          ) : (
            <MapPin className="w-4 h-4 text-red-600" />
          )}
        </div>

        <input
          id={id}
          type="text"
          value={inputValue}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full pl-9 pr-16 py-3 bg-slate-50 border border-slate-200 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 transition-all outline-hidden shadow-2xs"
          autoComplete="off"
        />

        <div className="absolute right-2 flex items-center gap-1">
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
              title="Löschen"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className="p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Aktuellen Standort verwenden"
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-y-auto divide-y divide-slate-100">
          {/* Quick Option: Aktueller Standort */}
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className="w-full text-left px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-red-50/50 transition-colors text-xs font-semibold text-red-700"
          >
            <Crosshair className="w-4 h-4 text-red-600 shrink-0" />
            <span>Aktuellen Standort verwenden</span>
          </button>

          {isLoading ? (
            <div className="px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 animate-spin" />
              <span>Suche Haltestellen …</span>
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((loc, idx) => (
              <button
                key={`${loc.label}-${idx}`}
                type="button"
                onClick={() => handleSelect(loc)}
                className="w-full text-left px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-slate-50 transition-colors"
              >
                {renderSuggestionIcon(loc.type)}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-800 truncate">{loc.label}</div>
                  {loc.municipality && (
                    <div className="text-[11px] text-slate-400 truncate">{loc.municipality}</div>
                  )}
                </div>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-xs text-slate-400">
              Keine Haltestelle gefunden
            </div>
          )}
        </div>
      )}
    </div>
  );
};
