import React from 'react';
import { Filter, Calendar, Building2, Layers, RotateCcw } from 'lucide-react';

interface FilterPanelProps {
  filters: {
    dateRange: string;
    plantId: string;
    department?: string;
    shift?: string;
  };
  onFilterChange: (filters: any) => void;
  onReset?: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onFilterChange, onReset }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs mb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <Filter className="w-4 h-4 text-[#0F8B8D]" />
          <span>Analytics Slicers &amp; Global Parameters</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filters.dateRange}
              onChange={(e) => onFilterChange({ ...filters, dateRange: e.target.value })}
              className="bg-transparent text-xs font-medium text-slate-700 outline-none cursor-pointer"
            >
              <option value="today">Today (Live Shifts)</option>
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days (MTD)</option>
              <option value="current_quarter">Current Quarter (Q3 2026)</option>
              <option value="ytd">Year to Date (YTD 2026)</option>
            </select>
          </div>

          {/* Plant Scope Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filters.plantId}
              onChange={(e) => onFilterChange({ ...filters, plantId: e.target.value })}
              className="bg-transparent text-xs font-medium text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">All Plants (Enterprise Multi-Site)</option>
              <option value="PLANT-01">Plant 01: Injection Molding (Pune)</option>
              <option value="PLANT-02">Plant 02: Extrusion &amp; Pipe (Manesar)</option>
              <option value="PLANT-03">Plant 03: Blow Molding (Hosur)</option>
            </select>
          </div>

          {/* Shift Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filters.shift || 'ALL'}
              onChange={(e) => onFilterChange({ ...filters, shift: e.target.value })}
              className="bg-transparent text-xs font-medium text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">All 3 Shifts (24/7)</option>
              <option value="Shift A">Shift A (06:00 - 14:00)</option>
              <option value="Shift B">Shift B (14:00 - 22:00)</option>
              <option value="Shift C">Shift C (22:00 - 06:00)</option>
            </select>
          </div>

          {/* Reset Button */}
          {onReset && (
            <button
              onClick={onReset}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Reset All Filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
