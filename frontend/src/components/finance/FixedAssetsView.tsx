import React, { useState } from 'react';
import { FixedAsset, JournalEntry } from '../../types';
import {
  Building,
  Plus,
  Cpu,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Search,
  DollarSign,
  TrendingDown,
  Calendar,
  Layers,
} from 'lucide-react';

interface Props {
  fixedAssets?: FixedAsset[];
  onCreateJE?: (je: JournalEntry) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
}

export const FixedAssetsView: React.FC<Props> = ({
  fixedAssets: initialAssets,
  onCreateJE,
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  const [assets, setAssets] = useState<FixedAsset[]>(
    initialAssets && initialAssets.length > 0
      ? initialAssets
      : [
          {
            id: 'FA-001',
            tag: 'EQ-ENGEL-250T',
            name: 'Engel Victory 250T Injection Molding Machine',
            category: 'Plant & Machinery',
            purchaseDate: '15 Jan 2024',
            cost: 3800000,
            accumDep: 633333,
            bookValue: 3166667,
            method: 'SLM',
            lifeYears: 10,
            location: 'Molding Bay 01',
            status: 'active',
          },
          {
            id: 'FA-002',
            tag: 'EQ-TOSH-180T',
            name: 'Toshiba EC180 All-Electric Injection Machine',
            category: 'Plant & Machinery',
            purchaseDate: '10 Jun 2024',
            cost: 4500000,
            accumDep: 562500,
            bookValue: 3937500,
            method: 'SLM',
            lifeYears: 10,
            location: 'Molding Bay 02',
            status: 'active',
          },
          {
            id: 'FA-003',
            tag: 'MOLD-CTN-500',
            name: '4-Cavity Precision Hot-Runner Mold (500ml Container)',
            category: 'Tooling & Molds',
            purchaseDate: '01 Mar 2025',
            cost: 480000,
            accumDep: 120000,
            bookValue: 360000,
            method: 'SLM',
            lifeYears: 4,
            location: 'Tool Room Rack A-12',
            status: 'active',
          },
          {
            id: 'FA-004',
            tag: 'EQ-CHILL-50TR',
            name: 'Central Industrial Water Chiller 50TR',
            category: 'Utilities & Plant Infrastructure',
            purchaseDate: '20 Nov 2023',
            cost: 950000,
            accumDep: 237500,
            bookValue: 712500,
            method: 'SLM',
            lifeYears: 8,
            location: 'Utility Room 01',
            status: 'active',
          },
        ]
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const totalCost = assets.reduce((s, a) => s + (a.cost || a.purchaseValue || 0), 0);
  const totalDep = assets.reduce((s, a) => s + (a.accumDep || 0), 0);
  const totalNBV = assets.reduce((s, a) => s + (a.bookValue || (a.purchaseValue || 0) - (a.accumDep || 0)), 0);

  const filteredAssets = assets.filter((a) => {
    const matchesCat = filterCategory === 'all' || a.category.toLowerCase().includes(filterCategory.toLowerCase());
    const tagStr = (a.tag || a.code || '').toLowerCase();
    const nameStr = (a.name || '').toLowerCase();
    const locStr = (a.location || '').toLowerCase();
    const q = searchTerm.toLowerCase();
    return matchesCat && (tagStr.includes(q) || nameStr.includes(q) || locStr.includes(q));
  });

  const handleOpenAddAsset = () => {
    let tag = '';
    let name = '';
    let category = 'Plant & Machinery';
    let cost = 1200000;
    let lifeYears = 10;
    let location = 'Molding Bay 01';

    openDrawer(
      'Capitalize New Fixed Asset',
      <div className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[#6B7280] font-semibold mb-1">Asset Tag / Asset # *</label>
            <input
              type="text"
              placeholder="e.g. EQ-LT-100T"
              className="w-full p-2 border border-[#E4E0D6] rounded-lg font-mono"
              onChange={(e) => {
                tag = e.target.value;
              }}
            />
          </div>
          <div>
            <label className="block text-[#6B7280] font-semibold mb-1">Asset Description *</label>
            <input
              type="text"
              placeholder="e.g. L&T 100T Hydraulic Molding Machine"
              className="w-full p-2 border border-[#E4E0D6] rounded-lg"
              onChange={(e) => {
                name = e.target.value;
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[#6B7280] font-semibold mb-1">Asset Class / Category *</label>
            <select
              defaultValue={category}
              className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white"
              onChange={(e) => {
                category = e.target.value;
              }}
            >
              <option value="Plant & Machinery">Plant &amp; Machinery (1400)</option>
              <option value="Tooling & Molds">Tooling &amp; Molds (1420)</option>
              <option value="Utilities & Plant Infrastructure">Utilities &amp; Plant Infrastructure</option>
              <option value="Office & IT Equipment">Office &amp; IT Equipment</option>
            </select>
          </div>
          <div>
            <label className="block text-[#6B7280] font-semibold mb-1">Location / Shop Floor</label>
            <input
              type="text"
              defaultValue={location}
              className="w-full p-2 border border-[#E4E0D6] rounded-lg"
              onChange={(e) => {
                location = e.target.value;
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[#6B7280] font-semibold mb-1">Capital Acquisition Cost (₹) *</label>
            <input
              type="number"
              defaultValue={cost}
              className="w-full p-2 border border-[#E4E0D6] rounded-lg font-mono font-bold text-[#14213D]"
              onChange={(e) => {
                cost = parseFloat(e.target.value) || 0;
              }}
            />
          </div>
          <div>
            <label className="block text-[#6B7280] font-semibold mb-1">Useful Life (Years) *</label>
            <input
              type="number"
              defaultValue={lifeYears}
              className="w-full p-2 border border-[#E4E0D6] rounded-lg font-mono"
              onChange={(e) => {
                lifeYears = parseInt(e.target.value) || 1;
              }}
            />
          </div>
        </div>
      </div>,
      <div className="flex justify-end gap-2">
        <button className="px-3 py-1.5 text-xs bg-white border border-[#E4E0D6] rounded-lg" onClick={closeDrawer}>
          Cancel
        </button>
        <button
          className="px-4 py-1.5 text-xs font-semibold bg-[#0F8B8D] text-white rounded-lg hover:bg-[#0D7A7C]"
          onClick={() => {
            if (!tag || !name) {
              showToast('Please enter both asset tag and description');
              return;
            }
            const newAsset: FixedAsset = {
              id: `FA-${assets.length + 1}`,
              tag,
              name,
              category,
              purchaseDate: new Date().toISOString().slice(0, 10),
              cost,
              accumDep: 0,
              bookValue: cost,
              method: 'SLM',
              lifeYears,
              location,
              status: 'active',
            };
            setAssets((prev) => [...prev, newAsset]);
            if (onCreateJE) {
              const jeId = `JE-${new Date().getFullYear()}-CAP-${Date.now().toString().slice(-4)}`;
              onCreateJE({
                id: jeId,
                date: new Date().toISOString().slice(0, 10),
                ref: `CAP-${tag}`,
                memo: `Asset Capitalization - ${name}`,
                currency: 'INR',
                status: 'posted',
                createdBy: 'Fixed Asset Accountant',
                approvedBy: 'Priya Rao (CFO)',
                lines: [
                  { account: '1400', desc: `Capitalize ${name}`, debit: cost, credit: 0, cc: 'CC-PROD-01', tax: '' },
                  { account: '1110', desc: 'HDFC Bank disbursement', debit: 0, credit: cost, cc: '', tax: '' },
                ],
              });
            }
            closeDrawer();
            showToast(`Asset ${tag} capitalized in Fixed Asset register and posted to GL!`);
          }}
        >
          Capitalize &amp; Post to GL
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-[#0F8B8D] font-bold">
            Finance &middot; Fixed Assets &amp; Capital Management
          </div>
          <h1 className="text-2xl font-bold text-[#14213D] font-['Space_Grotesk']">
            Fixed Asset Register &amp; Depreciation
          </h1>
          <p className="text-xs text-[#6B7280]">
            Capitalization of injection molding machines, tooling molds, straight-line depreciation schedules, and book values.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAddAsset}
            className="px-3.5 py-1.5 text-xs font-semibold bg-[#0F8B8D] text-white rounded-lg hover:bg-[#0D7A7C] flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> + Capitalize New Asset
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-[#E4E0D6] shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[#6B7280]">Gross Asset Cost</div>
          <div className="text-2xl font-bold text-[#14213D] font-mono mt-1">
            ₹{(totalCost / 100000).toFixed(2)} L
          </div>
          <div className="text-[10px] text-[#6B7280]">{assets.length} capitalized plant assets</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#E4E0D6] shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[#6B7280]">Accumulated Depreciation</div>
          <div className="text-2xl font-bold text-[#E8622C] font-mono mt-1">
            ₹{(totalDep / 100000).toFixed(2)} L
          </div>
          <div className="text-[10px] text-[#6B7280]">
            {((totalDep / totalCost) * 100).toFixed(1)}% amortized over useful life
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#E4E0D6] shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[#6B7280]">Net Book Value (NBV)</div>
          <div className="text-2xl font-bold text-[#0F8B8D] font-mono mt-1">
            ₹{(totalNBV / 100000).toFixed(2)} L
          </div>
          <div className="text-[10px] text-emerald-700">Balance sheet carrying value</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E4E0D6]">
        <div className="flex items-center gap-1 overflow-x-auto">
          {['all', 'Machinery', 'Molds', 'Infrastructure'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap capitalize transition-colors ${
                filterCategory === cat
                  ? 'bg-[#14213D] text-white'
                  : 'text-[#6B7280] hover:bg-[#F6F4EF]'
              }`}
            >
              {cat === 'all' ? 'All Classes' : cat}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search asset tag, name, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F6F4EF] border border-[#E4E0D6] rounded-lg focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F6F4EF] border-b border-[#E4E0D6] text-[#6B7280] text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Asset Tag</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Class</th>
                <th className="py-2.5 px-3">Acquired</th>
                <th className="py-2.5 px-3">Life (Yrs)</th>
                <th className="py-2.5 px-3 text-right">Gross Cost (₹)</th>
                <th className="py-2.5 px-3 text-right">Accum Dep (₹)</th>
                <th className="py-2.5 px-3 text-right">Net Book Value (₹)</th>
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E0D6]">
              {filteredAssets.map((asset) => {
                const costVal = asset.cost || asset.purchaseValue || 0;
                const depVal = asset.accumDep || 0;
                const nbvVal = asset.bookValue || (costVal - depVal);
                return (
                  <tr key={asset.id || asset.code || asset.tag} className="hover:bg-[#F6F4EF]/50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#0F8B8D]">{asset.tag || asset.code}</td>
                    <td className="py-2.5 px-3 font-semibold text-[#14213D]">{asset.name}</td>
                    <td className="py-2.5 px-3 text-[#6B7280]">{asset.category}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#6B7280]">{asset.purchaseDate}</td>
                    <td className="py-2.5 px-3 font-mono text-center">{asset.lifeYears || 10} yrs ({asset.method || 'SLM'})</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-right text-[#14213D]">
                      ₹{costVal.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-right text-[#E8622C]">
                      ₹{depVal.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-right text-emerald-700">
                      ₹{nbvVal.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-[#6B7280]">{asset.location}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700">
                        {asset.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
