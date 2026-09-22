import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Plus, Check, Search, X, Sparkles } from 'lucide-react';

export interface MasterDataComboboxProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  onAddNew?: (newVal: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  helperText?: string;
  isAutoFilled?: boolean;
  icon?: React.ReactNode;
  allowCustom?: boolean;
}

export const MasterDataCombobox: React.FC<MasterDataComboboxProps> = ({
  label,
  value,
  onChange,
  options = [],
  onAddNew,
  placeholder = 'Select or type to search...',
  required = false,
  disabled = false,
  className = '',
  helperText,
  isAutoFilled = false,
  icon,
  allowCustom = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || '');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal search term when external value changes
  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  // Handle outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        // If user typed something and clicked outside, commit if allowed
        if (allowCustom && searchTerm.trim() && searchTerm !== value) {
          onChange(searchTerm.trim());
          if (onAddNew && !options.some((o) => o.toLowerCase() === searchTerm.trim().toLowerCase())) {
            onAddNew(searchTerm.trim());
          }
        } else if (!allowCustom && !options.includes(searchTerm)) {
          setSearchTerm(value || '');
        }
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [searchTerm, value, options, allowCustom, onChange, onAddNew]);

  // Filtered options based on search term
  const filteredOptions = useMemo(() => {
    const term = (searchTerm || '').trim().toLowerCase();
    if (!term) return options;
    return options.filter((opt) => opt.toLowerCase().includes(term));
  }, [options, searchTerm]);

  const isExactMatch = useMemo(() => {
    const term = (searchTerm || '').trim().toLowerCase();
    return options.some((opt) => opt.toLowerCase() === term);
  }, [options, searchTerm]);

  const handleSelect = (opt: string) => {
    setSearchTerm(opt);
    onChange(opt);
    setIsOpen(false);
  };

  const handleCreateNew = (newVal: string) => {
    const clean = newVal.trim();
    if (!clean) return;
    onChange(clean);
    if (onAddNew) {
      onAddNew(clean);
    }
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label className="block font-semibold text-slate-700 text-xs">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          {isAutoFilled && (
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-medium border border-emerald-200 flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
              <span>Auto-filled</span>
            </span>
          )}
        </div>
      )}

      <div className="relative">
        {icon && (
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {icon}
          </div>
        )}

        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          disabled={disabled}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          className={`w-full ${icon ? 'pl-8' : 'pl-3'} pr-14 py-2 rounded-lg border text-xs transition-all ${
            isAutoFilled
              ? 'border-emerald-300 bg-emerald-50/20 text-slate-900 font-medium'
              : 'border-slate-300 bg-white text-slate-900 focus:border-[#0F8B8D] focus:ring-1 focus:ring-[#0F8B8D]'
          } disabled:bg-slate-100 disabled:text-slate-400`}
        />

        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {searchTerm && !disabled && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                onChange('');
                setIsOpen(true);
                inputRef.current?.focus();
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
              title="Clear selection"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setIsOpen((prev) => !prev);
              inputRef.current?.focus();
            }}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
            title="Toggle options"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {helperText && <p className="text-[10.5px] text-slate-400 mt-0.5">{helperText}</p>}

      {/* Floating Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden max-h-60 flex flex-col animate-in fade-in zoom-in-95 duration-100">
          <div className="p-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10.5px] text-slate-500 font-semibold uppercase px-2.5">
            <span className="flex items-center gap-1 text-slate-600">
              <Search className="w-3 h-3 text-[#0F8B8D]" />
              Master Catalog Options
            </span>
            <span className="font-mono text-slate-400">({filteredOptions.length})</span>
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-slate-50">
            {filteredOptions.map((opt) => {
              const isSelected = opt.toLowerCase() === (value || '').toLowerCase();
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-teal-50 text-[#0F8B8D] font-bold'
                      : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900'
                  }`}
                >
                  <span className="truncate pr-2">{opt}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#0F8B8D] shrink-0" />}
                </button>
              );
            })}

            {filteredOptions.length === 0 && (
              <div className="p-3 text-center text-xs text-slate-400">
                No matching options found in master catalog.
              </div>
            )}
          </div>

          {/* "+ Add New" from Admin side action */}
          {allowCustom && searchTerm.trim() && !isExactMatch && (
            <div className="p-1.5 bg-teal-50/50 border-t border-teal-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleCreateNew(searchTerm)}
                className="w-full text-left px-2.5 py-1.5 rounded-lg bg-[#0F8B8D] hover:bg-[#0c7274] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add "{searchTerm.trim()}" to Master Data Catalog</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
