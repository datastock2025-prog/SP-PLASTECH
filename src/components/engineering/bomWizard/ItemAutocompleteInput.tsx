import React, { useState, useEffect, useRef } from 'react';
import { ItemMaster } from '../../../types';
import { Search, ChevronDown, Check, X, Package, CheckCircle2, Plus } from 'lucide-react';

interface ItemAutocompleteInputProps {
  items: ItemMaster[];
  value: string;
  onSelect: (item: ItemMaster) => void;
  onChangeText?: (text: string) => void;
  onCreateNewItem?: (typedQuery?: string) => void;
  displayMode?: 'code' | 'name' | 'dual';
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  disabled?: boolean;
  filterTypes?: string[];
  filterExcludeCodes?: string[];
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
}

export const ItemAutocompleteInput: React.FC<ItemAutocompleteInputProps> = ({
  items,
  value,
  onSelect,
  onChangeText,
  onCreateNewItem,
  displayMode = 'code',
  placeholder = 'Type item number or search by name...',
  autoFocus = false,
  className = '',
  disabled = false,
  filterTypes,
  filterExcludeCodes,
  label,
  required = false,
  error,
  hint,
}) => {
  const [query, setQuery] = useState<string>(value || '');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal text query if external value prop updates
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter items based on user query and optional filters
  const filteredItems = React.useMemo(() => {
    if (!items || !Array.isArray(items)) return [];
    const q = (query || '').trim().toLowerCase();
    return items.filter((item) => {
      if (!item || !item.code) return false;

      // Task 5: Never show rejected items in operational autocompletes
      if (item.approval === 'rejected' || item.status === 'rejected' || item.status === 'blocked') {
        return false;
      }

      // Exclude specific codes (e.g. parent item cannot be component of itself)
      if (filterExcludeCodes && filterExcludeCodes.includes(item.code)) {
        return false;
      }
      // Type filter if specified
      if (filterTypes && filterTypes.length > 0) {
        const itemType = (item.type || '').toLowerCase();
        const itemCat = (item.cat || '').toLowerCase();
        const matchesType = filterTypes.some((t) => {
          const target = (t || '').toLowerCase();
          return itemType.includes(target) || itemCat.includes(target);
        });
        if (!matchesType) return false;
      }
      if (!q) return true;
      const codeStr = (item.code || '').toLowerCase();
      const nameStr = (item.name || '').toLowerCase();
      const catStr = (item.cat || '').toLowerCase();
      const resinStr = (item.resinType || '').toLowerCase();
      return (
        codeStr.includes(q) ||
        nameStr.includes(q) ||
        catStr.includes(q) ||
        resinStr.includes(q)
      );
    });
  }, [items, query, filterTypes, filterExcludeCodes]);

  // Selected item object if query matches an existing item code or name
  const currentItem = React.useMemo(() => {
    if (!query || !items || !Array.isArray(items)) return null;
    const clean = query.trim().toLowerCase();
    return (
      items.find((i) => (i?.code || '').toLowerCase() === clean) ||
      items.find((i) => (i?.name || '').toLowerCase() === clean) ||
      null
    );
  }, [items, query]);

  const handleSelect = (item: ItemMaster) => {
    if (!item) return;
    const textToSet = displayMode === 'name' ? item.name || item.code : item.code;
    setQuery(textToSet);
    onChangeText?.(textToSet);
    onSelect(item);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setQuery(text);
    onChangeText?.(text);
    setIsOpen(true);
    setHighlightedIndex(0);

    // If user typed/pasted the exact item code or name, trigger selection automatically
    const exactMatch = (items || []).find(
      (i) =>
        i &&
        ((i.code || '').toLowerCase() === text.trim().toLowerCase() ||
          (i.name || '').toLowerCase() === text.trim().toLowerCase())
    );
    if (exactMatch) {
      onSelect(exactMatch);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : prev));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      if (isOpen && highlightedIndex >= 0 && filteredItems[highlightedIndex]) {
        e.preventDefault();
        handleSelect(filteredItems[highlightedIndex]);
      } else if (currentItem) {
        handleSelect(currentItem);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleBlur = () => {
    // If the typed query is an exact match, ensure onSelect was triggered
    const exactMatch = (items || []).find(
      (i) =>
        i &&
        ((i.code || '').toLowerCase() === (query || '').trim().toLowerCase() ||
          (i.name || '').toLowerCase() === (query || '').trim().toLowerCase())
    );
    if (exactMatch) {
      onSelect(exactMatch);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="text-xs font-bold text-[#14213D] flex items-center justify-between mb-1">
          <span>
            {label} {required && <span className="text-rose-600">*</span>}
          </span>
          <div className="flex items-center gap-2">
            {onCreateNewItem && (
              <button
                type="button"
                onClick={() => onCreateNewItem(query)}
                className="text-[11px] font-semibold text-[#0F8B8D] hover:text-[#0c7274] flex items-center gap-0.5 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                + Create Item
              </button>
            )}
            {currentItem && (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Master Verified
              </span>
            )}
          </div>
        </label>
      )}

      <div className="relative flex items-center">
        <div className="absolute left-2.5 text-gray-400 pointer-events-none">
          <Search className="w-3.5 h-3.5" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          disabled={disabled}
          autoFocus={autoFocus}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full font-mono font-semibold text-xs pl-8 pr-16 py-2 border rounded-lg transition-all ${
            disabled ? 'bg-gray-50 text-gray-400' : 'bg-white text-[#14213D]'
          } ${
            error
              ? 'border-rose-500 bg-rose-50/40 focus:ring-1 focus:ring-rose-400'
              : currentItem
              ? 'border-emerald-500/80 bg-emerald-50/20 focus:border-emerald-600'
              : 'border-[#E4E0D6] focus:border-[#0F8B8D] focus:ring-1 focus:ring-[#0F8B8D]/20'
          }`}
        />

        <div className="absolute right-2 flex items-center gap-1">
          {query && !disabled && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                onChangeText?.('');
                setIsOpen(true);
                inputRef.current?.focus();
              }}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title="Clear input"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsOpen((prev) => !prev)}
            className="p-1 text-gray-400 hover:text-[#0F8B8D] rounded"
            title="Toggle item list"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {error && <p className="text-[11px] text-rose-600 mt-1 font-medium">{error}</p>}
      {hint && !error && <p className="text-[10px] text-gray-500 mt-1">{hint}</p>}

      {/* Floating Autocomplete Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl shadow-xl border border-[#E4E0D6] overflow-hidden max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-100 flex flex-col">
          <div className="p-1.5 bg-[#F6F4EF] border-b border-[#E4E0D6] flex items-center justify-between text-[10px] text-gray-600 font-semibold px-2.5">
            <span>AVAILABLE IN ITEM MASTER ({filteredItems.length})</span>
            <span className="text-[9px] text-gray-400">↑↓ to navigate · Enter to pick</span>
          </div>

          <div className="overflow-y-auto divide-y divide-gray-100 flex-1">
            {filteredItems.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-500">
                <Package className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                <p className="font-semibold text-gray-700">No matching items found</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  No Item Master matching &ldquo;{query}&rdquo;.
                </p>
                {onCreateNewItem && (
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setIsOpen(false);
                      onCreateNewItem(query);
                    }}
                    className="mt-2.5 px-3 py-1.5 bg-[#0F8B8D] hover:bg-[#0c7274] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Create &quot;{query || 'New Item'}&quot; in Master Data
                  </button>
                )}
              </div>
            ) : (
              filteredItems.map((item, index) => {
                const isSelected = item.code === query || item.name === query || item.code === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <div
                    key={item.code}
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent blur before select
                      handleSelect(item);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                      isHighlighted || isSelected
                        ? 'bg-amber-50/80 text-[#14213D]'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#0F8B8D]">{item.code}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 font-semibold truncate">
                          {item.type || item.cat}
                        </span>
                        {item.baseUOM && (
                          <span className="text-[10px] text-gray-400 font-mono font-medium">
                            [{item.baseUOM}]
                          </span>
                        )}
                      </div>
                      <span className="text-gray-900 font-medium truncate mt-0.5">{item.name}</span>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-2">
                      <div className="text-[11px] text-gray-500">
                        {item.stock && (
                          <span className="block font-mono text-[10px] text-gray-600 font-semibold">
                            Stock: {item.stock}
                          </span>
                        )}
                        {(item.standardCost || item.cost) && (
                          <span className="block font-mono text-[10px] text-emerald-700 font-bold">
                            ₹{(item.standardCost || item.cost)?.toFixed(2)}/{item.baseUOM}
                          </span>
                        )}
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {onCreateNewItem && (
            <div className="p-2 bg-[#F6F4EF] border-t border-[#E4E0D6] flex items-center justify-between">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsOpen(false);
                  onCreateNewItem(query);
                }}
                className="text-xs text-[#0F8B8D] hover:text-[#0c7274] font-bold flex items-center gap-1.5 px-2 py-1 rounded hover:bg-teal-50/50 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                + Create New Finished Good Item in Master Data
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsOpen(false);
                }}
                className="text-[11px] text-gray-500 hover:text-gray-700 px-2 py-1"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
