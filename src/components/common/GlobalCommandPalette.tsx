import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Command,
  X,
  PlayCircle,
  FileText,
  AlertTriangle,
  Boxes,
  Cpu,
  Clock,
  ExternalLink,
  Copy,
  ChevronRight,
  Sparkles,
  Database,
  Building2,
  Users,
  Settings,
  ShieldCheck,
  Package,
  Wrench,
  CheckCircle2,
  ArrowRight,
  Compass,
} from 'lucide-react';

export interface CommandResultItem {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  type: 'module' | 'record' | 'action' | 'report' | 'setting';
  module: string;
  statusBadge?: { text: string; color: string };
  lastUpdated?: string;
  targetView?: string;
  targetParam?: any;
}

interface GlobalCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string, param?: any) => void;
  onExecuteQuickAction?: (actionId: string) => void;
  showToast?: (msg: string) => void;
  currentModuleTitle?: string;
}

export const GlobalCommandPalette: React.FC<GlobalCommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onExecuteQuickAction,
  showToast = (_msg: string) => {},
  currentModuleTitle = 'Production',
}) => {
  const [query, setQuery] = useState('');
  const [activeScope, setActiveScope] = useState<string>('Global');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchScopes = [
    'Global',
    'Current Module',
    'Work Orders',
    'Items & Resin',
    'Machines & Presses',
    'Batches & Lots',
    'Quality & NCRs',
    'Purchase & Sales',
    'Settings & Admin',
  ];

  // Comprehensive master catalog for search
  const masterSearchDataset: CommandResultItem[] = [
    // Modules
    { id: 'MOD-01', code: 'PROD-MES', title: 'Injection Molding Execution (MES)', subtitle: 'Real-time press monitoring, cycle times, cavity count', type: 'module', module: 'Production', targetView: 'mfgDash' },
    { id: 'MOD-02', code: 'BOM-ENG', title: 'Mold & Recipe BOM Engineering', subtitle: 'Multi-level BOMs, resin %, masterbatch ratio', type: 'module', module: 'Engineering', targetView: 'bomList' },
    { id: 'MOD-03', code: 'QC-LAB', title: 'Quality SPC & Lab Inspections', subtitle: 'MFI testing, CMM scans, tensile strength, NCRs', type: 'module', module: 'Quality', targetView: 'qualityDash' },
    { id: 'MOD-04', code: 'WH-SILO', title: 'Raw Material Silo & Resin Warehouse', subtitle: 'Virgin polymers, regrind stock, lot traceability', type: 'module', module: 'Warehouse', targetView: 'stockOverview' },
    { id: 'MOD-05', code: 'ADM-CFG', title: 'Admin & Operations Control Center', subtitle: 'Plant branches, machine work centers, reason codes', type: 'module', module: 'Administration', targetView: 'adminDashboard' },
    { id: 'MOD-06', code: 'HR-HUB', title: 'HR Workforce & Shift Rosters', subtitle: 'Operator skills, 3-shift rotation, overtime tracking', type: 'module', module: 'HR', targetView: 'hrCommandCenter' },

    // Records: Work Orders
    { id: 'WO-101', code: 'WO-2026-0412', title: 'Bumper Grille Fascia PP-T20', subtitle: 'Engel 650T Press • Target: 1,200 Pcs • Cavity: 2', type: 'record', module: 'Production', statusBadge: { text: 'Running', color: 'bg-emerald-100 text-emerald-800' }, lastUpdated: '10 mins ago', targetView: 'mfgJobCard', targetParam: { id: 'WO-2026-0412' } },
    { id: 'WO-102', code: 'WO-2026-0415', title: 'Medical Vial Polypropylene Natural', subtitle: 'Fanuc Roboshot 100T • Target: 50,000 Pcs • Cleanroom', type: 'record', module: 'Production', statusBadge: { text: 'Scheduled', color: 'bg-blue-100 text-blue-800' }, lastUpdated: '1 hour ago', targetView: 'mfgJobCard', targetParam: { id: 'WO-2026-0415' } },
    { id: 'WO-103', code: 'WO-2026-0409', title: 'Auto Battery Casing HDPE Impact Grade', subtitle: 'Toshiba 450T • Target: 3,500 Pcs • 4-Cavity Die', type: 'record', module: 'Production', statusBadge: { text: 'Completed', color: 'bg-slate-100 text-slate-700' }, lastUpdated: 'Yesterday', targetView: 'mfgJobCard', targetParam: { id: 'WO-2026-0409' } },

    // Records: Items
    { id: 'ITM-01', code: 'RM-PP-CP01', title: 'Polypropylene Impact Copolymer (MFI 12)', subtitle: 'Sabic PP 579S • Density 0.905 g/cm³ • Stock: 18,400 KG', type: 'record', module: 'Item Master', statusBadge: { text: 'Available', color: 'bg-emerald-100 text-emerald-800' }, lastUpdated: 'Today', targetView: 'itemList', targetParam: { code: 'RM-PP-CP01' } },
    { id: 'ITM-02', code: 'MB-BLK-04', title: 'Black Masterbatch High-Jetness 40%', subtitle: 'Polyone Micro-dispersed Carbon Black • Stock: 850 KG', type: 'record', module: 'Item Master', statusBadge: { text: 'Low Stock', color: 'bg-amber-100 text-amber-800' }, lastUpdated: 'Today', targetView: 'itemList', targetParam: { code: 'MB-BLK-04' } },
    { id: 'ITM-03', code: 'FG-BUMP-01', title: 'Molded Automotive Front Grille Assembly', subtitle: 'Approved IATF OEM Part • Stock: 420 Sets', type: 'record', module: 'Item Master', statusBadge: { text: 'Available', color: 'bg-emerald-100 text-emerald-800' }, lastUpdated: '3 hours ago', targetView: 'itemList', targetParam: { code: 'FG-BUMP-01' } },

    // Records: Machines
    { id: 'MC-01', code: 'IMM-ENGEL-650', title: 'Engel Victory 650T Injection Press', subtitle: 'Tie-Bar-Less • OPC-UA Live • OEE: 88.4% • Hydraulic', type: 'record', module: 'Machines', statusBadge: { text: 'In Production', color: 'bg-emerald-100 text-emerald-800' }, lastUpdated: 'Active Now', targetView: 'adminMachines' },
    { id: 'MC-02', code: 'IMM-HAITIAN-450', title: 'Haitian Mars II 450T Servo Hydraulic', subtitle: 'Mold MLD-AUTO-09 • Cycle Time: 34.2s • Temp 230°C', type: 'record', module: 'Machines', statusBadge: { text: 'In Production', color: 'bg-emerald-100 text-emerald-800' }, lastUpdated: 'Active Now', targetView: 'adminMachines' },
    { id: 'MC-03', code: 'IMM-KM-350', title: 'KraussMaffei CX 350-1400 Hybrid', subtitle: 'Barrel Purging in Progress • Work Center WC-MOLD-03', type: 'record', module: 'Machines', statusBadge: { text: 'Downtime', color: 'bg-rose-100 text-rose-800' }, lastUpdated: '5 mins ago', targetView: 'adminMachines' },

    // Records: Batches & Lots
    { id: 'LOT-01', code: 'LOT-2026-0814', title: 'PP Resin Lot Sabic Jamnagar #RIL-9921', subtitle: '25 MT Inwarded • Moisture: 0.02% • Approved by QC', type: 'record', module: 'Warehouse', statusBadge: { text: 'Released', color: 'bg-emerald-100 text-emerald-800' }, lastUpdated: 'Sep 04', targetView: 'stockOverview' },
    { id: 'LOT-02', code: 'LOT-2026-0819', title: 'Molded Grille Lot #LOT-0819 Cavity 1-2', subtitle: '1,200 Pcs • Traceable to WO-2026-0412', type: 'record', module: 'Production', statusBadge: { text: 'Quarantine', color: 'bg-amber-100 text-amber-800' }, lastUpdated: 'Sep 05', targetView: 'ncrList' },

    // Records: Quality & NCR
    { id: 'NCR-01', code: 'NCR-2026-0041', title: 'Sink Marks on Bumper Trim Ribs', subtitle: 'Cavity #3 Pressure Drop • Hold Qty: 84 Pcs', type: 'record', module: 'Quality', statusBadge: { text: 'Under Review', color: 'bg-rose-100 text-rose-800' }, lastUpdated: '45 mins ago', targetView: 'ncrList' },

    // Actions & Shortcuts
    { id: 'ACT-01', code: 'ACT-WO-NEW', title: 'Quick Create Work Order', subtitle: 'Launch fast production work order creation modal', type: 'action', module: 'Production', targetView: '__QUICK_WO__' },
    { id: 'ACT-02', code: 'ACT-DT-LOG', title: 'Record Machine Downtime', subtitle: 'Log stop reason: mold change, heater band, barrel purge', type: 'action', module: 'Production', targetView: '__QUICK_DOWNTIME__' },
    { id: 'ACT-03', code: 'ACT-NCR-NEW', title: 'Create Non-Conformance Report', subtitle: 'Immediately hold suspect polymer batches or defect parts', type: 'action', module: 'Quality', targetView: '__QUICK_NCR__' },
    { id: 'ACT-04', code: 'ACT-GRN-NEW', title: 'Receive Polymer Goods (GRN)', subtitle: 'Record supplier delivery with tare weighbridge ticket', type: 'action', module: 'Warehouse', targetView: '__QUICK_GRN__' },
    { id: 'ACT-05', code: 'ACT-STOCK', title: 'Check Silo & Bin Inventory Levels', subtitle: 'Instant silo capacity gauge and resin bag balance', type: 'action', module: 'Warehouse', targetView: '__QUICK_STOCK__' },

    // Reports
    { id: 'RPT-01', code: 'RPT-OEE', title: 'Overall Equipment Effectiveness (OEE) Report', subtitle: 'Availability, Performance, and Quality analytics across all presses', type: 'report', module: 'Production', targetView: 'mfgDash' },
    { id: 'RPT-02', code: 'RPT-SCRAP', title: 'Polymer Scrap & Purge Analysis', subtitle: 'Scrap % by resin type, runner weight, and startup lumps', type: 'report', module: 'Quality', targetView: 'qualityDash' },

    // Settings
    { id: 'SET-01', code: 'SET-REASON', title: 'Reason Code Configuration', subtitle: 'Configure downtime, scrap, defect, and MRB codes', type: 'setting', module: 'Admin', targetView: 'adminReasonCodes' },
    { id: 'SET-02', code: 'SET-PLANT', title: 'Multi-Plant & Branch Configuration', subtitle: 'Manage Injection, Blow Molding, and Compounding units', type: 'setting', module: 'Admin', targetView: 'adminPlantSettings' },
    { id: 'SET-03', code: 'SET-WORKFLOW', title: 'Approval Workflows & Thresholds', subtitle: 'Configure multi-tier authorization for PO, WO, and scrap', type: 'setting', module: 'Admin', targetView: 'adminApprovalWorkflowConfig' },
    { id: 'SET-04', code: 'SET-QA-CONFIG', title: 'Quick Actions Administration', subtitle: 'Configure action pins, role permissions, and usage analytics', type: 'setting', module: 'Admin', targetView: 'adminQuickActionsConfig' },
  ];

  // Filter based on query and active scope
  const filteredResults = masterSearchDataset.filter((item) => {
    // Scope filter
    if (activeScope === 'Current Module') {
      if (item.module.toLowerCase() !== currentModuleTitle.toLowerCase() && !item.module.toLowerCase().includes(currentModuleTitle.toLowerCase())) {
        return false;
      }
    } else if (activeScope === 'Work Orders' && !item.code.startsWith('WO-') && item.module !== 'Production') {
      return false;
    } else if (activeScope === 'Items & Resin' && item.module !== 'Item Master') {
      return false;
    } else if (activeScope === 'Machines & Presses' && item.module !== 'Machines') {
      return false;
    } else if (activeScope === 'Batches & Lots' && !item.code.startsWith('LOT-')) {
      return false;
    } else if (activeScope === 'Quality & NCRs' && item.module !== 'Quality') {
      return false;
    } else if (activeScope === 'Settings & Admin' && item.type !== 'setting') {
      return false;
    }

    if (!query.trim()) return true;
    const cleanQ = query.toLowerCase().trim();
    return (
      item.title.toLowerCase().includes(cleanQ) ||
      item.code.toLowerCase().includes(cleanQ) ||
      item.subtitle.toLowerCase().includes(cleanQ) ||
      item.module.toLowerCase().includes(cleanQ)
    );
  });

  // Reset selected index on query change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeScope]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        handleSelectItem(filteredResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSelectItem = (item: CommandResultItem) => {
    if (item.targetView?.startsWith('__QUICK_')) {
      onClose();
      if (item.targetView === '__QUICK_WO__') onExecuteQuickAction?.('QA-001');
      else if (item.targetView === '__QUICK_DOWNTIME__') onExecuteQuickAction?.('QA-002');
      else if (item.targetView === '__QUICK_NCR__') onExecuteQuickAction?.('QA-004');
      else if (item.targetView === '__QUICK_GRN__') onExecuteQuickAction?.('QA-008');
      else if (item.targetView === '__QUICK_STOCK__') onExecuteQuickAction?.('QA-009');
      return;
    }

    if (item.targetView) {
      onNavigate(item.targetView, item.targetParam);
      onClose();
      showToast(`Navigated to ${item.title}`);
    }
  };

  const handleCopyCode = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(code);
    showToast(`Copied ${code} to clipboard`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 px-4">
      <div
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Search Header Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center gap-3">
          <Search className="w-5 h-5 text-[#0F8B8D] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search orders, items, batches, customers, suppliers, work orders... (Esc to exit)"
            className="w-full bg-transparent border-none outline-none text-sm sm:text-base text-slate-800 placeholder:text-slate-400 font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 rounded-md bg-white border border-slate-200 text-xs font-mono text-slate-500 shadow-xs hover:bg-slate-100"
          >
            ESC
          </button>
        </div>

        {/* Scope Filter Pills */}
        <div className="px-4 py-2 border-b border-slate-100 bg-white flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {searchScopes.map((scope) => (
            <button
              key={scope}
              onClick={() => setActiveScope(scope)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeScope === scope
                  ? 'bg-[#0F8B8D] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {scope}
            </button>
          ))}
        </div>

        {/* Search Results List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-100 max-h-[50vh]">
          {filteredResults.length === 0 ? (
            <div className="py-12 px-6 text-center text-slate-400">
              <Compass className="w-10 h-10 mx-auto mb-3 text-slate-300 stroke-[1.5]" />
              <div className="text-sm font-semibold text-slate-600">No matching records found</div>
              <div className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Try searching by work order number (e.g. WO-2026), polymer code (e.g. RM-PP), or machine name.
              </div>
            </div>
          ) : (
            filteredResults.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`group p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    isSelected ? 'bg-teal-50/70 text-slate-900 border border-teal-200/80 shadow-xs' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                        item.type === 'action'
                          ? 'bg-[#E8622C]/10 text-[#E8622C]'
                          : item.type === 'record'
                          ? 'bg-blue-50 text-blue-600'
                          : item.type === 'module'
                          ? 'bg-[#0F8B8D]/10 text-[#0F8B8D]'
                          : item.type === 'report'
                          ? 'bg-purple-50 text-purple-600'
                          : 'bg-amber-50 text-amber-600'
                      }`}
                    >
                      {item.type === 'action' ? (
                        <PlayCircle className="w-4 h-4" />
                      ) : item.type === 'record' ? (
                        <FileText className="w-4 h-4" />
                      ) : item.type === 'module' ? (
                        <Boxes className="w-4 h-4" />
                      ) : item.type === 'report' ? (
                        <Sparkles className="w-4 h-4" />
                      ) : (
                        <Settings className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.code}
                        </span>
                        <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                          {item.title}
                        </span>
                        {item.statusBadge && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${item.statusBadge.color}`}
                          >
                            {item.statusBadge.text}
                          </span>
                        )}
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          &bull; {item.module}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.lastUpdated && (
                      <span className="text-[11px] text-slate-400 hidden sm:inline-block">
                        {item.lastUpdated}
                      </span>
                    )}

                    <button
                      onClick={(e) => handleCopyCode(e, item.code)}
                      title="Copy identifier"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-[#0F8B8D]' : 'text-slate-300'}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Guide */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px] shadow-xs">
                &uarr; &darr;
              </kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px] shadow-xs">
                Enter
              </kbd>
              <span>Execute / Open</span>
            </span>
            <span className="flex items-center gap-1 hidden sm:flex">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px] shadow-xs">
                Esc
              </kbd>
              <span>Close</span>
            </span>
          </div>

          <div className="text-[11px] text-slate-400 hidden sm:block">
            ProTip: Press <span className="font-mono text-slate-600">Ctrl+Shift+Q</span> for Quick Actions menu
          </div>
        </div>
      </div>
    </div>
  );
};
