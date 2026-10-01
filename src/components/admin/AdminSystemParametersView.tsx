import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  FileText,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Clock,
  Coins,
  Globe,
} from 'lucide-react';
import { SystemParameter } from '../../types/admin';
import { systemParameters, mockSystemParameters } from '../../data/adminData';
import { adminService } from '../../services/adminService';
import { systemSettingsService, CURRENCY_OPTIONS, SystemSettingsConfig } from '../../services/systemSettingsService';

interface AdminSystemParametersViewProps {
  showToast?: (msg: string) => void;
}

export const AdminSystemParametersView: React.FC<AdminSystemParametersViewProps> = ({
  showToast = (_msg: string) => {},
}) => {
  const [parameters, setParameters] = useState<SystemParameter[]>(mockSystemParameters);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  // Enterprise Localization State (Currency, Time Format 12h/24h)
  const [settings, setSettings] = useState<SystemSettingsConfig>(systemSettingsService.getSettings());

  useEffect(() => {
    adminService.getParameters().then(setParameters);
  }, []);

  const handleUpdateCurrency = (currCode: string) => {
    const updated = systemSettingsService.updateSettings({ baseCurrency: currCode });
    setSettings(updated);
    showToast(`✓ Base Currency updated to ${updated.currencyName} across ERP.`);
  };

  const handleUpdateTimeFormat = (fmt: '12h' | '24h') => {
    const updated = systemSettingsService.updateSettings({ timeFormat: fmt });
    setSettings(updated);
    showToast(`✓ System Time Format updated to ${fmt === '24h' ? '24-Hour (14:30)' : '12-Hour AM/PM (02:30 PM)'}.`);
  };

  const handleUpdateNumberFormat = (fmt: 'indian' | 'international') => {
    const updated = systemSettingsService.updateSettings({ numberFormat: fmt });
    setSettings(updated);
    showToast(`✓ Number Formatting updated to ${fmt === 'indian' ? 'Indian (Lakhs / Crores)' : 'International (Millions)'}.`);
  };

  const handleUpdateSoValidityMonths = (months: number) => {
    const safeMonths = Math.max(1, isNaN(months) ? 1 : months);
    const updated = systemSettingsService.updateSettings({ salesOrderValidityMonths: safeMonths });
    setSettings(updated);
    showToast(`✓ Sales Order & Monthly Plan Expiry Validity updated to ${safeMonths} Month(s).`);
  };

  // Custom User Defined Fields (UDFs) State
  const [customFields, setCustomFields] = useState([
    { id: 'UDF-01', entity: 'Item Master (Raw Material)', fieldName: 'resinMeltFlowIndex', label: 'Polymer MFI (g/10min)', type: 'Number', required: true },
    { id: 'UDF-02', entity: 'Customer Master', fieldName: 'oemTierClassification', label: 'OEM Tier Level (Tier-1 / Tier-2)', type: 'Dropdown', required: true },
    { id: 'UDF-03', entity: 'Work Order', fieldName: 'toolCavityBlockNumber', label: 'Active Cavity Block Tag', type: 'Text', required: false },
  ]);

  const [newUdf, setNewUdf] = useState({
    entity: 'Item Master (Raw Material)',
    label: '',
    type: 'Text',
    required: false,
  });

  const categories = [
    'ALL',
    'Inventory & Traceability',
    'Production & Shop Floor',
    'Finance & Valuation',
    'Quality & AQL',
    'General System',
    'Security',
    'Database',
    'Scheduling',
  ];

  const filteredParams = parameters.filter(
    (p) => activeCategory === 'ALL' || p.category === activeCategory
  );

  const handleToggleBoolean = async (paramId: string) => {
    const target = parameters.find((p) => p.id === paramId);
    if (!target) return;
    const newVal = !target.currentValue;
    await adminService.updateParameter(paramId, String(newVal));
    setParameters((prev) =>
      prev.map((p) => {
        if (p.id === paramId) {
          return { ...p, currentValue: newVal };
        }
        return p;
      })
    );
  };

  const handleUpdateValue = async (paramId: string, val: any) => {
    await adminService.updateParameter(paramId, String(val));
    setParameters((prev) =>
      prev.map((p) => (p.id === paramId ? { ...p, currentValue: val } : p))
    );
  };

  const handleSaveAll = () => {
    showToast('Enterprise system flags, tolerance gates, and valuation parameters committed.');
  };

  const handleAddUdf = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUdf.label) return;
    const item = {
      id: `UDF-0${customFields.length + 1}`,
      entity: newUdf.entity,
      fieldName: newUdf.label.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      label: newUdf.label,
      type: newUdf.type,
      required: newUdf.required,
    };
    setCustomFields([...customFields, item]);
    setNewUdf({ entity: 'Item Master (Raw Material)', label: '', type: 'Text', required: false });
    showToast(`User Defined Field "${item.label}" added to ${item.entity}.`);
  };

  const handleRemoveUdf = (id: string) => {
    setCustomFields(customFields.filter((f) => f.id !== id));
    showToast('Custom field removed from entity model.');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <Sliders className="w-4 h-4 text-[#0F8B8D]" />
            <span>Core Logic &amp; Operational Controls</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Global System Parameters &amp; Custom Fields</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure negative stock prohibition, First-Expiry-First-Out (FEFO) allocation, invoice rounding, and extensible schema fields.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg shadow-sm transition-colors self-start md:self-auto"
        >
          <Save className="w-4 h-4" />
          Save System Parameters
        </button>
      </div>

      {/* TASK 3: Enterprise Currency & Time Format Configuration Card */}
      <div className="bg-gradient-to-r from-[#14213D] via-[#1E293B] to-[#0F172A] text-white p-5 rounded-2xl shadow-md border border-slate-700/50 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E8622C] flex items-center justify-center text-white font-bold text-sm">
              ₹
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                Enterprise Currency &amp; Time Display Settings
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Live System Scope
                </span>
              </h2>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Configure primary financial currency (defaults to Indian Rupee ₹) and standard 24h/12h timestamp presentation across all modules.
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-amber-300 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
              Active: {settings.baseCurrency} ({settings.currencySymbol}) &bull; {settings.timeFormat.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Base Currency Selection */}
          <div className="bg-white/5 border border-white/10 p-3 rounded-xl space-y-2">
            <label className="text-slate-300 font-bold block flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-[#E8622C]" />
              Base System Currency (Money)
            </label>
            <select
              value={settings.baseCurrency}
              onChange={(e) => handleUpdateCurrency(e.target.value)}
              className="w-full bg-slate-900/90 text-white border border-slate-700 rounded-lg px-2.5 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
            >
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                  {c.name}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400">
              Default is <strong>INR (₹)</strong>. Applied to BOM cost rollups, inventory valuation, and orders.
            </p>
          </div>

          {/* Time Display Format (24h vs 12h) */}
          <div className="bg-white/5 border border-white/10 p-3 rounded-xl space-y-2">
            <label className="text-slate-300 font-bold block flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              Time Format (24 Hours vs 12 Hours)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleUpdateTimeFormat('24h')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                  settings.timeFormat === '24h'
                    ? 'bg-[#0F8B8D] text-white border-[#0F8B8D] shadow-xs'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
              >
                24-Hour (14:30)
              </button>
              <button
                type="button"
                onClick={() => handleUpdateTimeFormat('12h')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                  settings.timeFormat === '12h'
                    ? 'bg-[#0F8B8D] text-white border-[#0F8B8D] shadow-xs'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
              >
                12-Hour (02:30 PM)
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              Sample: <span className="font-mono text-white">{systemSettingsService.formatTime(new Date())}</span>
            </p>
          </div>

          {/* Number System Format */}
          <div className="bg-white/5 border border-white/10 p-3 rounded-xl space-y-2">
            <label className="text-slate-300 font-bold block flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              Number Valuation Formatting
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleUpdateNumberFormat('indian')}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                  settings.numberFormat === 'indian'
                    ? 'bg-emerald-700 text-white border-emerald-600 shadow-xs'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
              >
                Indian (Lakhs/Cr)
              </button>
              <button
                type="button"
                onClick={() => handleUpdateNumberFormat('international')}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                  settings.numberFormat === 'international'
                    ? 'bg-emerald-700 text-white border-emerald-600 shadow-xs'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
              >
                International (Mil)
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              Sample: <span className="font-mono text-white">{systemSettingsService.formatMoney(1250000)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeCategory === cat
                ? 'bg-[#0F8B8D] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* System Parameters Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">ERP Business Rule Switches &amp; Tolerances</h2>
          <span className="text-xs text-slate-500">{filteredParams.length} Parameters Listed</span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredParams.map((param) => {
            const isBool =
              param.dataType === 'boolean' ||
              (param as any).valueType === 'boolean' ||
              param.currentValue === 'true' ||
              param.currentValue === 'false' ||
              typeof param.currentValue === 'boolean';

            const isBoolTrue =
              param.currentValue === true || param.currentValue === 'true';

            const isNumber =
              param.dataType === 'number' ||
              (param as any).valueType === 'number' ||
              (!isNaN(Number(param.currentValue)) && typeof param.currentValue !== 'boolean');

            const isSelect =
              (param.dataType as string) === 'select' ||
              (param.dataType as string) === 'enum' ||
              (param as any).valueType === 'select';

            return (
              <div
                key={param.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
              >
                <div className="max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-900">{param.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600">
                      {param.key}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-teal-50 text-teal-700">
                      {param.category}
                    </span>
                    {param.requiresRestart && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-50 text-amber-700">
                        Requires Restart
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{param.description}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {isBool ? (
                    <button
                      type="button"
                      onClick={() => handleToggleBoolean(param.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        isBoolTrue
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {isBoolTrue ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Enabled
                        </>
                      ) : (
                        'Disabled'
                      )}
                    </button>
                  ) : isSelect && (param as any).options ? (
                    <select
                      value={param.currentValue}
                      onChange={(e) => handleUpdateValue(param.id, e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                    >
                      {(param as any).options.map((opt: string) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <input
                        type={isNumber ? 'number' : 'text'}
                        value={param.currentValue}
                        onChange={(e) =>
                          handleUpdateValue(param.id, isNumber ? parseFloat(e.target.value) || 0 : e.target.value)
                        }
                        className="w-32 px-3 py-1.5 rounded-lg border border-slate-300 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Extensible User Defined Fields (UDF) Panel */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#0F8B8D]" />
              User Defined Fields (UDF) &amp; Schema Extensibility
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Add customized polymer engineering specifications and quality attributes to standard master tables.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">{customFields.length} Active Custom Attributes</span>
        </div>

        {/* Existing UDFs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {customFields.map((field) => (
            <div
              key={field.id}
              className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-500">{field.entity}</span>
                  <button
                    onClick={() => handleRemoveUdf(field.id)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="font-bold text-xs text-slate-900 mt-1">{field.label}</div>
                <div className="text-[11px] font-mono text-slate-500 mt-0.5">Key: {field.fieldName}</div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                  {field.type}
                </span>
                {field.required && (
                  <span className="text-rose-600 font-semibold">Mandatory</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add UDF Inline Form */}
        <form onSubmit={handleAddUdf} className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 text-xs">
          <span className="font-bold text-slate-800 block mb-2">Register New Custom Entity Attribute</span>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-600 mb-1">Target Entity</label>
              <select
                value={newUdf.entity}
                onChange={(e) => setNewUdf({ ...newUdf, entity: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
              >
                <option value="Item Master (Raw Material)">Item Master (Raw Material)</option>
                <option value="Customer Master">Customer Master</option>
                <option value="Supplier Master">Supplier Master</option>
                <option value="Work Order">Work Order</option>
                <option value="Quality Inspection Record">Quality Inspection Record</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 mb-1">Field Label Name</label>
              <input
                type="text"
                value={newUdf.label}
                onChange={(e) => setNewUdf({ ...newUdf, label: e.target.value })}
                placeholder="e.g. Tensile Modulus (MPa)"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1">Data Type</label>
              <select
                value={newUdf.type}
                onChange={(e) => setNewUdf({ ...newUdf, type: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
              >
                <option value="Text">Single-line Text</option>
                <option value="Number">Decimal Numeric</option>
                <option value="Dropdown">Dropdown Enum</option>
                <option value="Date">Date Picker</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={newUdf.required}
                  onChange={(e) => setNewUdf({ ...newUdf, required: e.target.checked })}
                  className="rounded text-[#0F8B8D]"
                />
                <span className="text-slate-700">Required</span>
              </label>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-[#0F8B8D] text-white font-semibold hover:bg-[#0c7274] transition-colors shadow-xs ml-auto"
              >
                Add Field
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
