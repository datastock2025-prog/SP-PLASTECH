import React, { useState } from 'react';
import {
  Sliders,
  Save,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Settings,
  Shield,
  Clock,
  DollarSign,
  Building,
} from 'lucide-react';
import { mockScmSettings } from '../../data/mockScmData';
import { ScmSettingsConfig } from '../../types/scm';

interface ScmSettingsViewProps {
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const ScmSettingsView: React.FC<ScmSettingsViewProps> = ({ onNavigate, showToast }) => {
  const [config, setConfig] = useState<ScmSettingsConfig>(mockScmSettings);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Saved SCM Planning Parameters, ABC/XYZ Thresholds, and Buffer Rules successfully');
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-xs font-semibold uppercase">
              System Configuration
            </span>
            <span className="text-xs text-slate-500">· Algorithm &amp; Safety Stock Policies</span>
          </div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D] mt-1">
            SCM Module Settings &amp; Planning Policies
          </h1>
          <p className="text-slate-500 text-xs">
            Configure MRP calculation cycles, safety stock day multipliers, ABC/XYZ stratification thresholds, and supplier lead-time buffers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('scmRbac')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Shield className="w-4 h-4 text-purple-600" />
            <span>Role Permissions (RBAC)</span>
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Policies</span>
          </button>
        </div>
      </div>

      {/* Settings Grid */}
      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* MRP & Engine Parameters */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-[#14213D] font-['Space_Grotesk'] border-b border-slate-100 pb-2">
            1. MRP Engine &amp; Calculation Policies
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Calculation Frequency</label>
              <select
                value={config.mrpCalculationFrequency}
                onChange={(e) => setConfig({ ...config, mrpCalculationFrequency: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <option value="Daily Nightly (02:00 AM)">Daily Nightly (02:00 AM)</option>
                <option value="Hourly Real-Time">Hourly Real-Time</option>
                <option value="Twice Daily (Shift Change)">Twice Daily (Shift Change)</option>
                <option value="Manual Trigger Only">Manual Trigger Only</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Planning Horizon (Days)</label>
                <input
                  type="number"
                  value={config.planningHorizonDays}
                  onChange={(e) => setConfig({ ...config, planningHorizonDays: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Forecast Consumption Mode</label>
                <select
                  value={config.forecastConsumptionMode}
                  onChange={(e) => setConfig({ ...config, forecastConsumptionMode: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="Forward and Backward Consumption">Forward &amp; Backward</option>
                  <option value="Backward Only">Backward Only</option>
                  <option value="Forward Only">Forward Only</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={config.autoGeneratePurchaseRequisitions}
                  onChange={(e) => setConfig({ ...config, autoGeneratePurchaseRequisitions: e.target.checked })}
                  className="rounded text-[#0F8B8D]"
                />
                <span>Auto-Generate Purchase Requisitions for Critical Polymer Shortages</span>
              </label>
            </div>
          </div>
        </div>

        {/* Safety Stock & Lead-Time Buffers */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-[#14213D] font-['Space_Grotesk'] border-b border-slate-100 pb-2">
            2. Safety Stock &amp; Lead-Time Buffers
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Virgin Polymer Buffer (Days)</label>
                <input
                  type="number"
                  value={config.safetyStockDaysVirgin}
                  onChange={(e) => setConfig({ ...config, safetyStockDaysVirgin: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Masterbatch Buffer (Days)</label>
                <input
                  type="number"
                  value={config.safetyStockDaysMasterbatch}
                  onChange={(e) => setConfig({ ...config, safetyStockDaysMasterbatch: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Additives Buffer (Days)</label>
                <input
                  type="number"
                  value={config.safetyStockDaysAdditives}
                  onChange={(e) => setConfig({ ...config, safetyStockDaysAdditives: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Import Port Clearance Buffer</label>
                <input
                  type="number"
                  value={config.leadTimeBufferImportDays}
                  onChange={(e) => setConfig({ ...config, leadTimeBufferImportDays: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Default Incoterm for Imports</label>
              <input
                type="text"
                value={config.defaultIncoterms}
                onChange={(e) => setConfig({ ...config, defaultIncoterms: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
