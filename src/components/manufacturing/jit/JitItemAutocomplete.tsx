import React, { useState, useRef, useEffect } from 'react';
import { Search, Check, Package, Layers, Clock, AlertCircle } from 'lucide-react';
import { ItemMaster } from '../../../types';
import { MoldMaster } from '../../../data/manufacturingData';

interface Props {
  items: ItemMaster[];
  molds: MoldMaster[];
  selectedCode: string;
  onSelectItem: (item: ItemMaster, suggestedMold?: MoldMaster) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const JitItemAutocomplete: React.FC<Props> = ({
  items,
  molds,
  selectedCode,
  onSelectItem,
  placeholder = 'Type item code or name (e.g. FG-CTN-500)...',
  disabled = false,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find currently selected item
  const currentItem = items.find((i) => i.code === selectedCode);

  useEffect(() => {
    if (currentItem) {
      setQuery(`${currentItem.code} — ${currentItem.name}`);
    } else if (!selectedCode) {
      setQuery('');
    }
  }, [selectedCode, currentItem]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset query text to current item if user didn't pick
        if (currentItem) {
          setQuery(`${currentItem.code} — ${currentItem.name}`);
        } else if (!selectedCode) {
          setQuery('');
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [currentItem, selectedCode]);

  // Filter items: prioritize Finished Goods and Semi-Finished Goods, but allow all items matching query
  const filteredItems = items
    .filter((item) => {
      const q = query.toLowerCase().trim();
      if (!q) return item.type === 'Finished Good' || item.type === 'Semi-Finished Good';
      return (
        item.code.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        (item.desc && item.desc.toLowerCase().includes(q)) ||
        (item.cat && item.cat.toLowerCase().includes(q))
      );
    })
    .slice(0, 10);

  const handleSelect = (item: ItemMaster) => {
    // Find compatible mold
    const matchedMold = molds.find(
      (m) =>
        m.compatibleProducts.includes(item.code) ||
        m.name.toLowerCase().includes(item.name.toLowerCase().split(' ')[0])
    );
    setQuery(`${item.code} — ${item.name}`);
    setIsOpen(false);
    onSelectItem(item, matchedMold);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 placeholder-slate-400 transition-all font-medium disabled:bg-slate-100 disabled:cursor-not-allowed"
        />
        {query && !disabled && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(true);
            }}
            className="absolute right-2.5 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full w-4 h-4 flex items-center justify-center"
            title="Clear"
          >
            ×
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto bg-white rounded-lg shadow-xl border border-slate-200 py-1 text-xs divide-y divide-slate-100">
          <div className="px-3 py-1.5 bg-slate-50 text-slate-500 font-semibold flex items-center justify-between text-[11px]">
            <span>Item Master Selection ({filteredItems.length} found)</span>
            <span className="text-[10px] text-slate-400">Finished Goods & SFG</span>
          </div>

          {filteredItems.length === 0 ? (
            <div className="p-4 text-center text-slate-500">
              <AlertCircle className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              No matching manufactured items found for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            filteredItems.map((item) => {
              const isSelected = item.code === selectedCode;
              const compatibleMold = molds.find((m) => m.compatibleProducts.includes(item.code));

              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className={`w-full text-left px-3 py-2.5 hover:bg-indigo-50 transition-colors flex items-start justify-between gap-2 group ${
                    isSelected ? 'bg-indigo-50/70' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-indigo-700 group-hover:text-indigo-900">
                        {item.code}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                          item.type === 'Finished Good'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.type === 'Semi-Finished Good'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.type}
                      </span>
                      {item.cat && (
                        <span className="text-[11px] text-slate-400 truncate">({item.cat})</span>
                      )}
                    </div>
                    <div className="text-slate-800 font-medium text-xs mt-0.5 truncate">
                      {item.name}
                    </div>

                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Package className="w-3 h-3 text-slate-400" />
                        Stock: <strong className="text-slate-700">{item.avail || item.stock}</strong>
                      </span>
                      {item.standardCycleTime ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          Cycle: <strong className="text-slate-700">{item.standardCycleTime}s</strong>
                        </span>
                      ) : null}
                      {compatibleMold && (
                        <span className="inline-flex items-center gap-1 text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                          <Layers className="w-3 h-3" />
                          Mold: {compatibleMold.name} ({compatibleMold.cavities} Cav)
                        </span>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex-shrink-0 text-indigo-600 pt-1">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
