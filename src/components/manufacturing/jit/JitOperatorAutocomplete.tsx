import React, { useState, useEffect, useRef } from 'react';
import { User, Plus, Check, Search, ShieldCheck } from 'lucide-react';
import { operatorMasterService, OperatorRecord } from '../../../services/operatorMasterService';

interface Props {
  value: string;
  onChange: (operatorName: string) => void;
  placeholder?: string;
  className?: string;
  allowCreate?: boolean;
}

export const JitOperatorAutocomplete: React.FC<Props> = ({
  value,
  onChange,
  placeholder = 'Select or type operator...',
  className = '',
  allowCreate = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const [operators, setOperators] = useState<OperatorRecord[]>(() => operatorMasterService.getOperators());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    return operatorMasterService.subscribe(() => {
      setOperators(operatorMasterService.getOperators());
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = operators.filter((op) =>
    op.name.toLowerCase().includes(query.toLowerCase()) || op.code.toLowerCase().includes(query.toLowerCase())
  );

  const exactMatch = operators.some(
    (op) => op.name.toLowerCase() === query.trim().toLowerCase()
  );

  const handleSelect = (op: OperatorRecord) => {
    setQuery(op.name);
    onChange(op.name);
    setIsOpen(false);
  };

  const handleCreateNew = () => {
    if (!query.trim()) return;
    const created = operatorMasterService.addOperator(query.trim());
    setQuery(created.name);
    onChange(created.name);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <User className="absolute left-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-8 pr-2.5 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400"
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg divide-y divide-slate-100 text-xs">
          {filtered.length > 0 ? (
            filtered.map((op) => (
              <button
                key={op.id}
                type="button"
                onClick={() => handleSelect(op)}
                className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-indigo-50/80 transition-colors ${
                  value === op.name ? 'bg-indigo-50 text-indigo-900 font-bold' : 'text-slate-700'
                }`}
              >
                <div>
                  <span className="font-semibold">{op.name}</span>
                  <span className="ml-1.5 font-mono text-[10px] text-slate-400">({op.code})</span>
                  <div className="text-[10px] text-slate-500">{op.role} &bull; {op.department}</div>
                </div>
                {value === op.name && <Check className="w-3.5 h-3.5 text-indigo-600" />}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-[11px] text-slate-500 italic">
              No matching operator found for "{query}"
            </div>
          )}

          {allowCreate && query.trim() && !exactMatch && (
            <button
              type="button"
              onClick={handleCreateNew}
              className="w-full text-left px-3 py-2.5 bg-emerald-50/90 hover:bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1.5 transition-colors border-t border-emerald-100"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
              <span>+ Create &amp; register new operator "{query.trim()}" in Admin Master</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
