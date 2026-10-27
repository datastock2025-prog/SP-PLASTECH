import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X, Check } from 'lucide-react';

export interface ModernDatePickerProps {
  value?: string;
  onChange: (dateStr: string) => void;
  placeholder?: string;
  required?: boolean;
  hasError?: boolean;
  className?: string;
  minDate?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function formatDateDisplay(iso: string): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return iso;
  const shortMonth = MONTH_NAMES[m]?.slice(0, 3) || '';
  return `${String(d).padStart(2, '0')} ${shortMonth} ${y}`;
}

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export const ModernDatePicker: React.FC<ModernDatePickerProps> = ({
  value = '',
  onChange,
  placeholder = 'Select date...',
  hasError = false,
  className = '',
  minDate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const parsedInitial = () => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m] = value.split('-').map(Number);
      return { year: y, month: m - 1 };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  };

  const [{ year: viewYear, month: viewMonth }, setViewDate] = useState(parsedInitial);

  useEffect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m] = value.split('-').map(Number);
      setViewDate({ year: y, month: m - 1 });
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const todayIso = new Date().toISOString().split('T')[0];

  const handlePrevMonth = () => {
    setViewDate((prev) =>
      prev.month === 0 ? { year: prev.year - 1, month: 11 } : { year: prev.year, month: prev.month - 1 }
    );
  };

  const handleNextMonth = () => {
    setViewDate((prev) =>
      prev.month === 11 ? { year: prev.year + 1, month: 0 } : { year: prev.year, month: prev.month + 1 }
    );
  };

  const handleSelectDay = (iso: string) => {
    if (minDate && iso < minDate) return;
    onChange(iso);
    setIsOpen(false);
  };

  const handlePreset = (offsetDays: number) => {
    const dt = new Date();
    dt.setDate(dt.getDate() + offsetDays);
    const iso = dt.toISOString().split('T')[0];
    onChange(iso);
    setIsOpen(false);
  };

  const cells: Array<{ day: number; iso: string; isCurrentMonth: boolean }> = [];
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const prevM = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
    cells.push({ day: d, iso: toIsoDate(prevY, prevM, d), isCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, iso: toIsoDate(viewYear, viewMonth, d), isCurrentMonth: true });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
    cells.push({ day: d, iso: toIsoDate(nextY, nextM, d), isCurrentMonth: false });
  }

  const years = Array.from({ length: 15 }, (_, idx) => new Date().getFullYear() - 3 + idx);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen((o) => !o);
          }
        }}
        className={`w-full flex items-center justify-between text-xs py-2 px-3 border rounded-lg bg-white transition-all cursor-pointer select-none ${
          hasError
            ? 'border-rose-500 bg-rose-50/40 ring-1 ring-rose-200'
            : isOpen
              ? 'border-[#0F8B8D] ring-2 ring-teal-500/15 shadow-xs'
              : 'border-[#E4E0D6] hover:border-[#0F8B8D]/60'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
            value ? 'bg-teal-50 text-[#0F8B8D]' : 'bg-slate-100 text-slate-400'
          }`}>
            <Calendar className="w-3.5 h-3.5" />
          </div>
          {value ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-bold text-[#14213D]">{formatDateDisplay(value)}</span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{value}</span>
            </div>
          ) : (
            <span className="text-slate-400 font-medium">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition-colors"
              title="Clear date"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-76 bg-white rounded-2xl border border-[#E4E0D6] shadow-2xl p-3.5 animate-in fade-in zoom-in-95 duration-150">
          {/* Header: Month & Year Selectors + Navigation */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <select
                value={viewMonth}
                onChange={(e) => setViewDate({ year: viewYear, month: Number(e.target.value) })}
                className="text-xs font-extrabold text-[#14213D] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:border-[#0F8B8D]"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                value={viewYear}
                onChange={(e) => setViewDate({ year: Number(e.target.value), month: viewMonth })}
                className="text-xs font-mono font-bold text-[#0F8B8D] bg-teal-50/60 hover:bg-teal-50 border border-teal-200 rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:border-[#0F8B8D]"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-teal-50 hover:text-[#0F8B8D] hover:border-teal-200 transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-teal-50 hover:text-[#0F8B8D] hover:border-teal-200 transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Preset Pills */}
          <div className="flex items-center gap-1.5 mb-2.5">
            <button
              type="button"
              onClick={() => handlePreset(0)}
              className="flex-1 py-1 px-2 rounded-lg text-[10px] font-bold bg-teal-50 text-[#0F8B8D] hover:bg-teal-100 border border-teal-200/70 transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handlePreset(30)}
              className="flex-1 py-1 px-2 rounded-lg text-[10px] font-semibold bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              +30 Days
            </button>
            <button
              type="button"
              onClick={() => handlePreset(365)}
              className="flex-1 py-1 px-2 rounded-lg text-[10px] font-semibold bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              +1 Year
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-1 text-center">
            {WEEKDAYS.map((wd) => (
              <div key={wd} className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-1">
                {wd}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, idx) => {
              const isSelected = value === cell.iso;
              const isToday = todayIso === cell.iso;
              const isDisabled = Boolean(minDate && cell.iso < minDate);

              return (
                <button
                  key={`${cell.iso}-${idx}`}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelectDay(cell.iso)}
                  className={`h-8 rounded-lg text-xs font-medium flex items-center justify-center transition-all relative ${
                    isDisabled
                      ? 'text-slate-300 cursor-not-allowed opacity-50'
                      : isSelected
                        ? 'bg-[#0F8B8D] text-white font-bold shadow-sm ring-2 ring-teal-500/30 cursor-pointer'
                        : isToday
                          ? 'bg-amber-50 text-amber-800 font-bold border border-amber-300 hover:bg-amber-100 cursor-pointer'
                          : cell.isCurrentMonth
                            ? 'text-[#14213D] hover:bg-teal-50 hover:text-[#0F8B8D] cursor-pointer'
                            : 'text-slate-300 hover:bg-slate-50 hover:text-slate-500 cursor-pointer'
                  }`}
                >
                  {cell.day}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-amber-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className="text-slate-500 hover:text-rose-600 font-semibold px-2 py-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#14213D] text-white font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Check className="w-3 h-3" /> Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernDatePicker;

