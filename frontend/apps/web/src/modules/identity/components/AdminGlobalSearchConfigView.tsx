import React, { useState, useMemo } from 'react';
import {
  Search,
  Settings,
  ArrowRight,
  Shield,
  Building,
  Boxes,
  Cpu,
  Calendar,
  AlertOctagon,
  Database,
  FileText,
  KeyRound,
  Users,
  CheckCircle2,
  Sparkles,
  Command,
  Sliders,
} from 'lucide-react';

interface SearchResultItem {
  id: string;
  title: string;
  category: string;
  path: string;
  targetTab: string;
  description: string;
  keywords: string[];
  icon: any;
}

const searchableCatalog: SearchResultItem[] = [
  {
    id: 'CFG-01',
    title: 'Short Shot / Incomplete Cavity Filling Rejection Reason',
    category: 'Reason Code Setup',
    path: 'Admin > Reason Codes > Production > Rejection Reasons',
    targetTab: 'adminReasonCodes',
    description: 'Injection pressure, low melt temp, or frozen gate countermeasure settings.',
    keywords: ['short shot', 'rejection', 'defect', 'plastic', 'gate', 'molding'],
    icon: AlertOctagon,
  },
  {
    id: 'CFG-02',
    title: 'Barrel Purging & Color Cleanout Downtime Code',
    category: 'Reason Code Setup',
    path: 'Admin > Reason Codes > Production > Downtime Reasons',
    targetTab: 'adminReasonCodes',
    description: 'Standard purge compound procedures for carbon black transitions.',
    keywords: ['purging', 'downtime', 'color change', 'cleanout', 'barrel'],
    icon: AlertOctagon,
  },
  {
    id: 'CFG-03',
    title: 'Cold Runner Sprues & Machine Purge Lump Categories',
    category: 'Reason Code Setup',
    path: 'Admin > Reason Codes > Production > Runner/Lumbes Categories',
    targetTab: 'adminReasonCodes',
    description: 'Beside-the-press granulation and heavy shredder lump parameters.',
    keywords: ['runner', 'lump', 'sprue', 'regrind', 'scrap', 'shredder'],
    icon: AlertOctagon,
  },
  {
    id: 'CFG-04',
    title: 'Moisture Loss & Broken Bag Spillage Stock Adjustments',
    category: 'Reason Code Setup',
    path: 'Admin > Reason Codes > Warehouse > Stock Adjustment Reasons',
    targetTab: 'adminReasonCodes',
    description: '0.15% evaporation threshold and forklift puncture write-off policy.',
    keywords: ['moisture', 'evaporation', 'bag', 'spill', 'warehouse', 'adjustment'],
    icon: Boxes,
  },
  {
    id: 'CFG-05',
    title: 'Melt Flow Index (MFI) & Spectrophotometer Delta-E Defect Codes',
    category: 'Reason Code Setup',
    path: 'Admin > Reason Codes > Quality > Defect Codes',
    targetTab: 'adminReasonCodes',
    description: 'CIELAB Delta-E > 0.8 shade deviations and MFI testing tolerance rules.',
    keywords: ['mfi', 'delta-e', 'spectrophotometer', 'quality', 'color', 'defect'],
    icon: AlertOctagon,
  },
  {
    id: 'CFG-06',
    title: 'Hydraulic Valve Failure & 500-Hr Oil Filtration PM Codes',
    category: 'Reason Code Setup',
    path: 'Admin > Reason Codes > Maintenance',
    targetTab: 'adminReasonCodes',
    description: 'Proportional valve pressure drop and kidney-loop filtration standards.',
    keywords: ['hydraulic', 'valve', 'breakdown', 'maintenance', 'pm', 'oil'],
    icon: Settings,
  },
  {
    id: 'CFG-07',
    title: 'Raw Polymer Resin Outdoor Silo Locations (SILO-PP-01)',
    category: 'Warehouse & Locations',
    path: 'Admin > Warehouse Locations > External Silo Yard',
    targetTab: 'adminWarehouseLocations',
    description: '50,000 KG high-capacity bulk pneumatic storage coordinates.',
    keywords: ['silo', 'warehouse', 'location', 'bin', 'pp', 'polymer', 'pneumatic'],
    icon: Boxes,
  },
  {
    id: 'CFG-08',
    title: 'Engel Victory 650 Ton Tie-Bar-Less Injection Machine',
    category: 'Machine / Work Centers',
    path: 'Admin > Machine Work Centers > Bay-A Heavy Automotive',
    targetTab: 'adminMachines',
    description: '6500 kN clamp force, 90mm screw, Euromap 63 PLC gateway 192.168.20.101.',
    keywords: ['engel', '650t', 'machine', 'injection', 'press', 'tonnage', 'clamping'],
    icon: Cpu,
  },
  {
    id: 'CFG-09',
    title: 'Morning Shift A, Evening Shift B & Graveyard Night Shift C',
    category: 'Shift & Working Calendar',
    path: 'Admin > Shifts & Calendar > Daily Schedules',
    targetTab: 'adminShifts',
    description: '3-shift rotation, ₹250 night allowance, 15-min mold handover buffers.',
    keywords: ['shift', 'calendar', 'night shift', 'allowance', 'hours', 'handover'],
    icon: Calendar,
  },
  {
    id: 'CFG-10',
    title: 'Tool Room Mold Maintenance Gang & Color Lab Crews',
    category: 'User Groups',
    path: 'Admin > User Groups > TOOL-MAINT & COLOR-LAB',
    targetTab: 'adminUserGroups',
    description: 'Cross-functional shopfloor squads with mold inspection authorizations.',
    keywords: ['user group', 'gang', 'crew', 'technicians', 'maintenance', 'lab'],
    icon: Users,
  },
  {
    id: 'CFG-11',
    title: 'Bulk Polymer Resin Procurement PO Approval Pipeline (>₹5L)',
    category: 'Approval Workflows',
    path: 'Admin > Approval Workflows > WF-PO-POLYMER',
    targetTab: 'adminWorkflowsConfig',
    description: '3-stage authorization with SCM Purchase, Financial Controller, and VP Ops.',
    keywords: ['approval', 'workflow', 'po', 'purchase order', 'procurement', 'sla'],
    icon: Sliders,
  },
  {
    id: 'CFG-12',
    title: 'Corporate Legal Identity, CIN, PAN & Headquarters GSTIN',
    category: 'Company Settings',
    path: 'Admin > Company Settings > Statutory Identifiers',
    targetTab: 'adminCompanySettings',
    description: 'Reboot Polymers Pvt. Ltd. CIN U25209PN2021PTC199842 and IATF license.',
    keywords: ['company', 'cin', 'pan', 'gstin', 'organization', 'corporate', 'iatf'],
    icon: Building,
  },
  {
    id: 'CFG-13',
    title: 'Pune / Chakan Hub & Sanand Precision Multi-Plant Settings',
    category: 'Plant & Branch Settings',
    path: 'Admin > Plant Settings > Factory Licenses & Power kVA',
    targetTab: 'adminPlantSettings',
    description: 'Connected power grid 3200 kVA, factory licenses, and pollution consents.',
    keywords: ['plant', 'branch', 'chakan', 'sanand', 'factory', 'power', 'substation'],
    icon: Building,
  },
  {
    id: 'CFG-14',
    title: 'Enterprise Plastics Suite License Key & Plant Quota Meter',
    category: 'License & Subscription',
    path: 'Admin > License & Subscription',
    targetTab: 'adminLicense',
    description: 'Active license key RBT-PLST-ENT-2026, 3 of 5 plants, 85 of 100 seats.',
    keywords: ['license', 'subscription', 'key', 'seats', 'contract', 'quota'],
    icon: KeyRound,
  },
  {
    id: 'CFG-15',
    title: 'Master Data Governance (Polymer Resins, Dies & OEM Customers)',
    category: 'Master Data',
    path: 'Admin > Master Data Management',
    targetTab: 'adminMasterData',
    description: 'Golden record approvals for raw polypropylene, masterbatches, and bumper tools.',
    keywords: ['master data', 'golden record', 'resin', 'mold', 'customer', 'item'],
    icon: Database,
  },
  {
    id: 'CFG-16',
    title: 'Euromap 63 / 77 OPC-UA Machine Telemetry Connector',
    category: 'Integration Management',
    path: 'Admin > Integration Management',
    targetTab: 'adminIntegrationsConfig',
    description: 'OPC-UA server, Avery weighbridge, and X-Rite spectrophotometer connectors.',
    keywords: ['opc-ua', 'euromap', 'integration', 'connector', 'weighbridge', 'edi'],
    icon: Cpu,
  },
];

interface AdminGlobalSearchConfigViewProps {
  onNavigateTab?: (tabId: string) => void;
  showToast?: (msg: string) => void;
}

export const AdminGlobalSearchConfigView: React.FC<AdminGlobalSearchConfigViewProps> = ({
  onNavigateTab = (_tabId: string) => {},
  showToast = (_msg: string) => {},
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = useMemo(() => {
    const set = new Set(searchableCatalog.map((c) => c.category));
    return ['ALL', ...Array.from(set)];
  }, []);

  const results = useMemo(() => {
    return searchableCatalog.filter((item) => {
      const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      if (!searchTerm.trim()) return matchCat;
      const term = searchTerm.toLowerCase();
      const matchText =
        item.title.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.path.toLowerCase().includes(term) ||
        item.keywords.some((k) => k.toLowerCase().includes(term));
      return matchCat && matchText;
    });
  }, [searchTerm, selectedCategory]);

  const handleJump = (tabId: string, title: string) => {
    showToast(`Navigating to: ${title}`);
    onNavigateTab(tabId);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <Command className="w-4 h-4 text-[#0F8B8D]" />
            <span>Spotlight &amp; Universal Navigation</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Admin Settings Search / Global Configuration Search</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Instantly query any reason code, clamping press spec, warehouse silo, approval rule, factory license, or integration gateway across the entire ERP administration suite.
          </p>
        </div>
      </div>

      {/* Spotlight Search Box */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            autoFocus
            placeholder="Search anything (e.g. short shot, 650T, night shift, silo, GSTIN, PO approval, license key)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F8B8D] shadow-xs"
          />
        </div>

        {/* Categories Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#0F8B8D] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
          <span>Search Results ({results.length})</span>
          <span>Click any item to jump directly to screen</span>
        </div>

        {results.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              onClick={() => handleJump(item.targetTab, item.title)}
              className="bg-white hover:bg-slate-50/90 rounded-xl border border-slate-200 p-4 shadow-xs transition-all cursor-pointer flex items-start justify-between gap-4 group"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F8B8D] border border-teal-200 flex items-center justify-center shrink-0 group-hover:bg-[#0F8B8D] group-hover:text-white transition-colors">
                  <Icon className="w-5 h-5" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                      {item.category}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">{item.path}</span>
                  </div>

                  <h3 className="font-bold text-xs text-slate-900 mt-1 group-hover:text-[#0F8B8D] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{item.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0F8B8D] shrink-0 self-center group-hover:translate-x-0.5 transition-transform">
                <span>Configure</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          );
        })}

        {results.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
            <Search className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <div className="font-bold text-sm text-slate-700">No configuration records found</div>
            <p className="text-xs text-slate-500 mt-1">Try searching for keywords like "rejection", "mfi", "press", "silo", or "shift".</p>
          </div>
        )}
      </div>
    </div>
  );
};
