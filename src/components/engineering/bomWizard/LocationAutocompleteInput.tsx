import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, Search, ChevronDown, Check, X, Building, Archive, Layers, ShieldAlert, Cpu } from 'lucide-react';
import { masterDataGovernanceService } from '../../../services/masterDataGovernanceService';
import { INITIAL_WAREHOUSE_LOCATIONS } from '../../../data/warehouseData';

export interface LocationOption {
  code: string;
  name: string;
  zone: string;
  warehouseCode?: string;
  type?: 'raw_material' | 'silo' | 'masterbatch' | 'wip_staging' | 'secondary' | 'finished_goods' | 'tooling' | 'quarantine' | 'general';
}

// Enterprise Unified Master Locations List
export const DEFAULT_ENTERPRISE_LOCATIONS: LocationOption[] = [
  // Raw Materials, Resins & Bulk Silos
  { code: 'RM-WH-01', name: 'Raw Material Polymer Silos & Bulk Bags', zone: 'Zone A - Bulk Silos', warehouseCode: 'WH-RM-01', type: 'raw_material' },
  { code: 'RM-WH-02', name: 'Additives & Specialty Chemicals Vault', zone: 'Zone B - Additives', warehouseCode: 'WH-RM-02', type: 'raw_material' },
  { code: 'SILO-A1', name: 'Polypropylene (PP) Homopolymer Silo #1', zone: 'Zone A - Heavy Polymer Silos', warehouseCode: 'RM-WH-01', type: 'silo' },
  { code: 'SILO-A2', name: 'HDPE Injection Grade Silo #2', zone: 'Zone A - Heavy Polymer Silos', warehouseCode: 'RM-WH-01', type: 'silo' },
  { code: 'SILO-A3', name: 'Polycarbonate / ABS Blends Silo #3', zone: 'Zone A - Heavy Polymer Silos', warehouseCode: 'RM-WH-01', type: 'silo' },
  { code: 'SILO-PP-01', name: 'External Silo Yard (PP/HDPE)', zone: 'Z-SILO', warehouseCode: 'WH-PUN-01', type: 'silo' },
  { code: 'SILO-ZONE-A', name: 'Raw Material Polymer Silos & Bulk Bags', zone: 'Zone A - Heavy Polymer Silos', warehouseCode: 'WH-RM-01', type: 'silo' },
  { code: 'BAG-RACK-01', name: '25KG Bagged Virgin Polymer Pallet Rack', zone: 'Zone A - Bulk Bags', warehouseCode: 'RM-WH-01', type: 'raw_material' },
  { code: 'A-01-01', name: 'Raw Material Racking Aisle 1 Shelf 1', zone: 'Aisle 1', warehouseCode: 'RM-WH-01', type: 'raw_material' },
  { code: 'A-01-02', name: 'Raw Material Racking Aisle 1 Shelf 2', zone: 'Aisle 1', warehouseCode: 'RM-WH-01', type: 'raw_material' },
  { code: 'A-01-03', name: 'Raw Material Racking Aisle 1 Shelf 3', zone: 'Aisle 1', warehouseCode: 'RM-WH-01', type: 'raw_material' },

  // Masterbatch & Colorants
  { code: 'MB-STORE-01', name: 'Masterbatch Climate-Controlled Vault (22°C)', zone: 'Zone B - Climate Control', warehouseCode: 'MB-STORE-01', type: 'masterbatch' },
  { code: 'MB-RACK-01', name: 'Automotive Grade Color Masterbatch Rack 1', zone: 'Zone B - Additives Vault', warehouseCode: 'MB-STORE-01', type: 'masterbatch' },
  { code: 'MB-RACK-02', name: 'UV Stabilizer & Blowing Agent Vault Rack 2', zone: 'Zone B - Additives Vault', warehouseCode: 'MB-STORE-01', type: 'masterbatch' },
  { code: 'MB-BLK-04C', name: 'Color Masterbatch Cleanroom A/C Storage', zone: 'Z-MB-AC', warehouseCode: 'WH-PUN-01', type: 'masterbatch' },
  { code: 'MB-RACK-ZONE-B', name: 'Masterbatch & Additive Dehumidified Store', zone: 'Zone B - Additives Vault', warehouseCode: 'WH-MB-02', type: 'masterbatch' },

  // Regrind & Recycling
  { code: 'RG-WH-01', name: 'Closed-Loop Regrind & Granulator Silos', zone: 'Zone D - Regrind', warehouseCode: 'RG-WH-01', type: 'raw_material' },
  { code: 'RG-BIN-01', name: 'Regrind Flake Dedicated Silo Bin 1', zone: 'Zone D - Regrind Recycling', warehouseCode: 'RG-WH-01', type: 'raw_material' },
  { code: 'REGRIND-ZONE-D', name: 'Closed-Loop Regrind & Granulator Silos', zone: 'Zone D - Regrind Recycling', warehouseCode: 'WH-RG-04', type: 'raw_material' },

  // WIP & Secondary Staging Locations
  { code: 'WIP-STAGE-01', name: 'Primary Machine-Side WIP Buffer Staging', zone: 'Zone WIP - Press Floor Buffer', warehouseCode: 'WH-PUN-01', type: 'wip_staging' },
  { code: 'WIP-STAGE-02', name: 'Secondary Operations In-Process Staging', zone: 'Zone WIP - Secondary Buffer', warehouseCode: 'WH-PUN-01', type: 'wip_staging' },
  { code: 'SEC-AREA-01', name: 'Post-Molding Finishing & Trimming Cell', zone: 'Zone SEC - Secondary Finishing', warehouseCode: 'WH-PUN-01', type: 'secondary' },
  { code: 'WC-SEC-01', name: 'Post-Molding Finishing Work Center Cell', zone: 'Finishing Cell #1', warehouseCode: 'WH-PUN-01', type: 'secondary' },
  { code: 'ASSEMBLY-STORE', name: 'Assembly Staging & Metal Insert Store', zone: 'Zone AS - Assembly Cell', warehouseCode: 'WH-ASM-07', type: 'wip_staging' },
  { code: 'ASM-ZONE-G', name: 'Assembly & Sub-Assembly Warehouse Store', zone: 'Zone G - Sub-Assembly Staging', warehouseCode: 'WH-ASM-07', type: 'wip_staging' },
  { code: 'DEFLASH-STORE', name: 'De-Flash, Degating & Flame Polishing Bay', zone: 'Zone DF - Finishing Bay', warehouseCode: 'WH-DFL-08', type: 'secondary' },
  { code: 'DFL-ZONE-H', name: 'De-Flash & Trimming Buffer Store', zone: 'Zone H - De-Flashing Staging', warehouseCode: 'WH-DFL-08', type: 'secondary' },

  // Finished Goods
  { code: 'FG-WH-01', name: 'Finished Goods Pallet High-Bay Store', zone: 'Zone C - High-Bay Racks', warehouseCode: 'FG-WH-01', type: 'finished_goods' },
  { code: 'FG-BAY-A1', name: 'Automated High-Bay Pallet Bay A1', zone: 'Zone C - Automated High-Bay', warehouseCode: 'FG-WH-01', type: 'finished_goods' },
  { code: 'FG-BAY-A2', name: 'Automated High-Bay Pallet Bay A2', zone: 'Zone C - Automated High-Bay', warehouseCode: 'FG-WH-01', type: 'finished_goods' },
  { code: 'FG-PALLET-01', name: 'Finished Goods Pallet High-Bay Racking', zone: 'Zone C - Automated High-Bay Racks', warehouseCode: 'WH-FG-03', type: 'finished_goods' },
  { code: 'FG-PALLET-ZONE-C', name: 'Finished Goods Pallet High-Bay Racking', zone: 'Zone C - Automated High-Bay Racks', warehouseCode: 'WH-FG-03', type: 'finished_goods' },

  // Tooling & Mold Crib
  { code: 'SP-WH-01', name: 'Machine Spares & Mold Tooling Crib', zone: 'Zone T - Tool Crib', warehouseCode: 'SP-WH-01', type: 'tooling' },
  { code: 'TOOL-DIE-T01', name: 'Heavy Steel Injection Mold Die Crib #1', zone: 'Zone T - Mold Tooling Crib', warehouseCode: 'WH-TOOL-06', type: 'tooling' },
  { code: 'TOOL-DIE-T02', name: 'Hot Runner Spare Parts & Core Pin Storage', zone: 'Zone T - Tool Crib', warehouseCode: 'WH-TOOL-06', type: 'tooling' },
  { code: 'MOLD-CRIB-ZONE-F', name: 'Injection Mold & Tooling Heavy Storage', zone: 'Zone F - Mold Tooling Crib', warehouseCode: 'WH-TOOL-06', type: 'tooling' },

  // Quarantine & Inspection
  { code: 'QUARANTINE-HOLD-01', name: 'Quarantine & Off-Spec Hold Cage', zone: 'Zone E - Quarantine Area', warehouseCode: 'WH-QC-05', type: 'quarantine' },
  { code: 'QRN-LOT-99', name: 'Lab Inspection & Non-Conformance Cage', zone: 'Quarantine', warehouseCode: 'RM-WH-01', type: 'quarantine' },
];

export interface LocationAutocompleteInputProps {
  value: string;
  onChange: (locationCode: string, locationObj?: LocationOption) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  filterType?: 'all' | 'raw_materials' | 'staging_wip' | 'finished_goods';
  className?: string;
  size?: 'sm' | 'md';
}

export const LocationAutocompleteInput: React.FC<LocationAutocompleteInputProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Select or search location...',
  required = false,
  filterType = 'all',
  className = '',
  size = 'md',
}) => {
  const [query, setQuery] = useState<string>(value || '');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal query when value prop changes
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Assemble dynamic live locations from masterDataGovernanceService & default list
  const allLocations = useMemo(() => {
    const map = new Map<string, LocationOption>();

    // 1. Add base defaults
    DEFAULT_ENTERPRISE_LOCATIONS.forEach((loc) => map.set(loc.code.toUpperCase(), loc));

    // 2. Add INITIAL_WAREHOUSE_LOCATIONS from warehouseData
    (INITIAL_WAREHOUSE_LOCATIONS || []).forEach((wh) => {
      if (wh.code && !map.has(wh.code.toUpperCase())) {
        map.set(wh.code.toUpperCase(), {
          code: wh.code,
          name: wh.name,
          zone: wh.zone || wh.description || 'Warehouse Zone',
          warehouseCode: wh.id,
          type: wh.type === 'bulk_silo' ? 'silo' : wh.type === 'wip_staging' ? 'wip_staging' : wh.type === 'pallet_rack' ? 'finished_goods' : 'general',
        });
      }
    });

    // 3. Add dynamic live warehouses & bins from Master Data Governance Service
    try {
      const dynamicWhs = masterDataGovernanceService.getWarehouses();
      dynamicWhs.forEach((w) => {
        if (w.code && !map.has(w.code.toUpperCase())) {
          map.set(w.code.toUpperCase(), {
            code: w.code,
            name: w.name,
            zone: w.zone || 'Master Warehouse Zone',
            warehouseCode: w.code,
            type: w.code.startsWith('RM') ? 'raw_material' : w.code.startsWith('WIP') || w.code.includes('STAGE') ? 'wip_staging' : 'general',
          });
        }
      });

      const dynamicBins = masterDataGovernanceService.getBins();
      dynamicBins.forEach((b) => {
        if (b.code && !map.has(b.code.toUpperCase())) {
          map.set(b.code.toUpperCase(), {
            code: b.code,
            name: `${b.code} (${b.zone || b.warehouseCode})`,
            zone: b.zone || 'Storage Bin',
            warehouseCode: b.warehouseCode,
            type: b.code.startsWith('SILO') ? 'silo' : b.code.startsWith('WIP') ? 'wip_staging' : 'general',
          });
        }
      });
    } catch (e) {
      console.warn('Master data locations lookup notice:', e);
    }

    return Array.from(map.values());
  }, []);

  // Filter locations by query & filterType
  const filteredLocations = useMemo(() => {
    const q = (query || '').trim().toLowerCase();

    return allLocations.filter((loc) => {
      // Type filtering
      if (filterType === 'raw_materials') {
        if (loc.type === 'finished_goods' || loc.type === 'tooling') return false;
      } else if (filterType === 'staging_wip') {
        if (loc.type === 'finished_goods' || loc.type === 'tooling') return false;
      } else if (filterType === 'finished_goods') {
        if (loc.type === 'raw_material' || loc.type === 'silo') return false;
      }

      if (!q) return true;
      const codeMatch = loc.code.toLowerCase().includes(q);
      const nameMatch = loc.name.toLowerCase().includes(q);
      const zoneMatch = loc.zone.toLowerCase().includes(q);
      const whMatch = (loc.warehouseCode || '').toLowerCase().includes(q);
      return codeMatch || nameMatch || zoneMatch || whMatch;
    });
  }, [allLocations, query, filterType]);

  const selectedLocObj = allLocations.find((l) => l.code.toUpperCase() === (value || '').toUpperCase());

  const handleSelect = (loc: LocationOption) => {
    setQuery(loc.code);
    onChange(loc.code, loc);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setQuery(text);
    onChange(text);
    if (!isOpen) setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex((prev) => (prev < filteredLocations.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(filteredLocations.length - 1);
      } else {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredLocations.length - 1));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredLocations.length) {
        handleSelect(filteredLocations[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const getTypeBadge = (type?: LocationOption['type']) => {
    switch (type) {
      case 'silo':
      case 'raw_material':
        return <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-200">Raw / Silo</span>;
      case 'masterbatch':
        return <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-medium border border-purple-200">Vault 22°C</span>;
      case 'wip_staging':
        return <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-medium border border-amber-200">WIP Buffer</span>;
      case 'secondary':
        return <span className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 text-[10px] font-medium border border-teal-200">Secondary Cell</span>;
      case 'finished_goods':
        return <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-medium border border-emerald-200">FG Store</span>;
      case 'quarantine':
        return <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-medium border border-rose-200">Hold Cage</span>;
      case 'tooling':
        return <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-300">Mold Crib</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded bg-gray-50 text-gray-600 text-[10px] font-medium border border-gray-200">Storage</span>;
    }
  };

  const isSmall = size === 'sm';

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {label && (
        <label className="text-[11px] font-bold text-[#14213D] block mb-1">
          {label} {required && <span className="text-rose-600">*</span>}
        </label>
      )}

      {/* Input container */}
      <div className="relative flex items-center">
        <MapPin className={`absolute left-2.5 text-gray-400 pointer-events-none ${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full bg-white border border-[#E4E0D6] rounded-lg font-mono text-gray-800 transition-all focus:outline-none focus:ring-1 focus:ring-[#0F8B8D] focus:border-[#0F8B8D] ${
            isSmall ? 'py-1 pl-7 pr-12 text-xs' : 'py-1.5 pl-8 pr-14 text-xs'
          }`}
        />

        {/* Clear and Dropdown toggles */}
        <div className="absolute right-1.5 flex items-center gap-0.5">
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                onChange('');
                inputRef.current?.focus();
              }}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title="Clear"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setIsOpen(!isOpen);
              inputRef.current?.focus();
            }}
            className="p-1 text-gray-400 hover:text-gray-700 rounded transition-transform duration-150"
            title="Toggle Locations"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Autocomplete Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-[#E4E0D6] max-h-64 overflow-y-auto divide-y divide-gray-100 text-xs animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <span className="font-semibold flex items-center gap-1 text-[#14213D]">
              <Building className="w-3 h-3 text-[#0F8B8D]" />
              Enterprise Warehouse &amp; Staging Locations
            </span>
            <span className="font-mono text-[10px] text-gray-400">{filteredLocations.length} locations</span>
          </div>

          {filteredLocations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p className="font-semibold text-gray-700">No matching locations found</p>
              <p className="text-[11px] mt-0.5">You can keep "{query}" as a custom location code.</p>
            </div>
          ) : (
            filteredLocations.map((loc, idx) => {
              const isSelected = (value || '').toUpperCase() === loc.code.toUpperCase();
              const isHighlighted = highlightedIndex === idx;

              return (
                <button
                  key={`${loc.code}-${idx}`}
                  type="button"
                  onClick={() => handleSelect(loc)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`w-full text-left p-2.5 flex items-start justify-between gap-2 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-teal-50/80 text-[#0F8B8D]'
                      : isHighlighted
                      ? 'bg-amber-50/50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#14213D] text-xs">
                        {loc.code}
                      </span>
                      {getTypeBadge(loc.type)}
                    </div>
                    <p className="text-[11px] text-gray-600 truncate">{loc.name}</p>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Archive className="w-2.5 h-2.5 text-gray-400" />
                      <span>{loc.zone}</span>
                    </p>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-[#0F8B8D] shrink-0 mt-1" />
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
