import React from 'react';
import { TimeMode } from '../../types/routing';
import { Clock } from 'lucide-react';

interface DateTimeSelectorProps {
  timeMode: TimeMode;
  selectedDateTime: string; // ISO string or local YYYY-MM-DDTHH:mm
  onChangeMode: (mode: TimeMode) => void;
  onChangeDateTime: (dateTime: string) => void;
}

export const DateTimeSelector: React.FC<DateTimeSelectorProps> = ({
  timeMode,
  selectedDateTime,
  onChangeMode,
  onChangeDateTime,
}) => {
  // Format to HTML input datetime-local format (YYYY-MM-DDTHH:mm)
  const toInputValue = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const parsedDate = new Date(e.target.value);
      onChangeDateTime(parsedDate.toISOString());
    }
  };

  return (
    <div className="space-y-2">
      {/* Segmented Buttons: Jetzt | Abfahrt um | Ankunft bis */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl">
        <button
          type="button"
          onClick={() => onChangeMode('NOW')}
          className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
            timeMode === 'NOW'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Jetzt
        </button>

        <button
          type="button"
          onClick={() => onChangeMode('DEPARTURE')}
          className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
            timeMode === 'DEPARTURE'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Abfahrt um
        </button>

        <button
          type="button"
          onClick={() => onChangeMode('ARRIVAL')}
          className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
            timeMode === 'ARRIVAL'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Ankunft bis
        </button>
      </div>

      {/* Date-Time Picker if not NOW */}
      {timeMode !== 'NOW' && (
        <div className="relative flex items-center">
          <Clock className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="datetime-local"
            value={toInputValue(selectedDateTime)}
            onChange={handleInputChange}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-red-500 focus:ring-1 focus:ring-red-200 shadow-2xs"
          />
        </div>
      )}
    </div>
  );
};
