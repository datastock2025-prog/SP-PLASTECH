import React, { useState } from 'react';
import { InspectionPlan } from '../../types';
import {
  Ruler,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
  Copy,
  Edit2,
  Trash2,
  Tag,
  Shield,
  Layers,
} from 'lucide-react';

interface Props {
  inspectionPlans: InspectionPlan[];
  selectedId?: string;
  onNavigate: (view: string, param?: any) => void;
  onCreatePlan?: (plan: InspectionPlan) => void;
  onUpdatePlan?: (plan: InspectionPlan) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
}

export const InspectionPlansView: React.FC<Props> = ({
  inspectionPlans: initialPlans,
  selectedId,
  onNavigate,
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  const [plans, setPlans] = useState<InspectionPlan[]>(initialPlans);
  const [activePlanId, setActivePlanId] = useState<string>(
    selectedId || plans[0]?.id || 'IQC-PP-REV3'
  );
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredPlans = plans.filter((p) => {
    const matchesType = filterType === 'all' || p.type.toLowerCase() === filterType.toLowerCase();
    const matchesSearch =
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.item.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const currentPlan = plans.find((p) => p.id === activePlanId) || filteredPlans[0] || plans[0];

  const handleOpenCreateDrawer = () => {
    let id = `QPL-${Date.now().toString().slice(-4)}`;
    let name = '';
    let type: 'Incoming' | 'In-Process' | 'Final' | 'Lab' = 'Incoming';
    let item = 'RM-HD-GRN-014';
    let rev = '1';
    let sampling = 'ISO 2859 · AQL Normal Level II';
    let params = [
      {
        seq: 1,
        parameter: 'Melt Flow Index (MFI)',
        method: 'ASTM D1238',
        uom: 'g/10min',
        target: '11.0',
        min: '9.5',
        max: '12.5',
        critical: true,
        instrument: 'MFI Tester (CEAST 7027)',
        sampleSize: 3,
      },
      {
        seq: 2,
        parameter: 'Moisture Content',
        method: 'Karl Fischer / LOD',
        uom: 'ppm',
        target: '<250',
        min: '0',
        max: '250',
        critical: true,
        instrument: 'Moisture Analyzer',
        sampleSize: 2,
      },
    ];

    openDrawer(
      'Create Quality Inspection Plan Protocol',
      <div className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Plan Code</label>
            <input
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded bg-[#F6F4EF] font-mono"
              defaultValue={id}
              onChange={(e) => (id = e.target.value)}
            />
          </div>
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Revision</label>
            <input
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded font-mono"
              defaultValue={rev}
              onChange={(e) => (rev = e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-[#14213D] mb-1">Plan Protocol Name</label>
          <input
            className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded"
            placeholder="e.g. HDPE High Rigidity Resin Inspection Protocol"
            defaultValue={name}
            onChange={(e) => (name = e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Inspection Stage</label>
            <select
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded bg-white"
              defaultValue={type}
              onChange={(e) => (type = e.target.value as any)}
            >
              <option value="Incoming">Incoming (IQC)</option>
              <option value="In-Process">In-Process (IPQC)</option>
              <option value="Final">Final Release (FQC)</option>
              <option value="Lab">Laboratory Analysis</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Associated Item Code</label>
            <input
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded font-mono"
              defaultValue={item}
              onChange={(e) => (item = e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-[#14213D] mb-1">Sampling Standard &amp; Frequency</label>
          <input
            className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded"
            defaultValue={sampling}
            onChange={(e) => (sampling = e.target.value)}
          />
        </div>

        <div className="border-t border-[#E4E0D6] pt-3">
          <div className="font-bold text-[#14213D] mb-2 flex items-center justify-between">
            <span>Pre-Configured Test Parameters ({params.length})</span>
            <span className="text-[10px] text-[#0F8B8D]">ISO 9001 / ASTM Compliance</span>
          </div>
          <div className="space-y-2">
            {params.map((p, idx) => (
              <div key={idx} className="p-2.5 bg-[#F6F4EF] rounded border border-[#E4E0D6]">
                <div className="flex items-center justify-between font-semibold text-[#14213D]">
                  <span>#{p.seq}. {p.parameter}</span>
                  <span className="font-mono text-[10px] text-[#0F8B8D]">{p.target} {p.uom}</span>
                </div>
                <div className="text-[11px] text-[#6B7280] mt-0.5">
                  Method: {p.method} | Gauge: {p.instrument} | Spec: [{p.min} - {p.max}]
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>,
      <div className="flex justify-end gap-2 w-full">
        <button
          onClick={closeDrawer}
          className="px-3 py-1.5 text-xs font-semibold border border-[#E4E0D6] rounded text-[#6B7280] hover:bg-[#F6F4EF]"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            const newPlan: InspectionPlan = {
              id: id || `QPL-${Date.now()}`,
              name: name || `${item} Quality Protocol`,
              type,
              item,
              rev,
              status: 'Active',
              effectiveDate: 'Today',
              lastUsed: 'Never',
              sampling,
              params,
            };
            setPlans((prev) => [newPlan, ...prev]);
            setActivePlanId(newPlan.id);
            closeDrawer();
            showToast(`Inspection Plan ${newPlan.id} successfully created and released.`);
          }}
          className="px-4 py-1.5 text-xs font-semibold bg-[#14213D] text-white rounded hover:bg-[#1f3158]"
        >
          Save &amp; Release Plan
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
            Quality Management &middot; Inspection Protocols &amp; AQL
          </div>
          <h1 className="text-2xl font-bold text-[#14213D] font-['Space_Grotesk']">
            Inspection Plans &amp; Test Protocols
          </h1>
          <p className="text-xs text-[#6B7280]">
            Standardized Quality Plans (Q-Plans) defining parameter limits, ASTM/ISO methods, instruments, and AQL sample sizes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreateDrawer}
            className="px-3.5 py-1.5 text-xs font-semibold bg-[#14213D] text-white rounded-lg hover:bg-[#1f3158] flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> + New Inspection Plan
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E4E0D6] shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-2.5 top-2 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Search plans, items, IDs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#E4E0D6] rounded-lg focus:outline-none focus:border-[#0F8B8D]"
            />
          </div>
          <div className="flex items-center gap-1">
            {['all', 'Incoming', 'In-Process', 'Final', 'Lab'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors capitalize ${
                  filterType.toLowerCase() === t.toLowerCase()
                    ? 'bg-[#0F8B8D] text-white'
                    : 'text-[#6B7280] hover:bg-[#F6F4EF]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="text-xs text-[#6B7280] font-mono">
          Showing <strong>{filteredPlans.length}</strong> active quality plans
        </div>
      </div>

      {/* Main Split View: Plan Selector & Protocol Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List Column */}
        <div className="lg:col-span-5 space-y-3">
          {filteredPlans.map((plan) => {
            const isSelected = plan.id === currentPlan?.id;
            return (
              <div
                key={plan.id}
                onClick={() => setActivePlanId(plan.id)}
                className={`p-4 bg-white rounded-xl border transition-all cursor-pointer shadow-sm ${
                  isSelected
                    ? 'border-[#0F8B8D] ring-2 ring-[#0F8B8D]/15'
                    : 'border-[#E4E0D6] hover:border-[#0F8B8D]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[#0F8B8D]">{plan.id}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F6F4EF] text-[#6B7280] font-bold">
                      Rev {plan.rev}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      plan.type === 'Incoming'
                        ? 'bg-blue-50 text-blue-700'
                        : plan.type === 'In-Process'
                        ? 'bg-purple-50 text-purple-700'
                        : plan.type === 'Final'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {plan.type}
                  </span>
                </div>

                <div className="font-bold text-sm text-[#14213D] mt-1.5">{plan.name}</div>
                <div className="text-xs text-[#6B7280] font-mono mt-0.5">Item: {plan.item}</div>

                <div className="flex items-center justify-between text-[11px] text-[#6B7280] mt-3 pt-2 border-t border-[#E4E0D6]">
                  <span>{plan.params.length} Parameters</span>
                  <span className="text-emerald-700 font-semibold">{plan.status}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Detail Inspector */}
        <div className="lg:col-span-7">
          {currentPlan ? (
            <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm p-5 space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-[#E4E0D6] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#0F8B8D]">{currentPlan.id}</span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#F6F4EF] text-[#14213D]">
                      Revision {currentPlan.rev}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {currentPlan.status}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-[#14213D] mt-1 font-['Space_Grotesk']">
                    {currentPlan.name}
                  </h2>
                  <p className="text-xs text-[#6B7280] mt-0.5 font-mono">
                    Target Material / Part: <strong>{currentPlan.item}</strong> &middot; Effective Date: {currentPlan.effectiveDate}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => showToast(`Cloned template of ${currentPlan.id}`)}
                    className="p-1.5 text-xs text-[#6B7280] hover:text-[#14213D] border border-[#E4E0D6] rounded-lg hover:bg-[#F6F4EF]"
                    title="Clone Plan"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => showToast(`Opening revision editor for ${currentPlan.id}`)}
                    className="p-1.5 text-xs text-[#6B7280] hover:text-[#14213D] border border-[#E4E0D6] rounded-lg hover:bg-[#F6F4EF]"
                    title="Edit Revision"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Protocol Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-[#F6F4EF]/70 rounded-lg border border-[#E4E0D6] text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#6B7280] block">Inspection Type</span>
                  <span className="font-semibold text-[#14213D]">{currentPlan.type} Inspection</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#6B7280] block">Sampling Standard</span>
                  <span className="font-semibold text-[#14213D] truncate">{currentPlan.sampling}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#6B7280] block">Last Executed</span>
                  <span className="font-mono text-[#14213D]">{currentPlan.lastUsed}</span>
                </div>
              </div>

              {/* Parameter Specification Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#14213D] flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-[#0F8B8D]" />
                    Inspection Characteristics &amp; Tolerance Limits
                  </h3>
                  <span className="text-[11px] text-[#6B7280] font-mono">
                    {currentPlan.params.length} Verified Tests
                  </span>
                </div>

                <div className="overflow-x-auto border border-[#E4E0D6] rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#F6F4EF] border-b border-[#E4E0D6] text-[#6B7280] text-[10px] uppercase tracking-wider">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Characteristic</th>
                        <th className="py-2.5 px-3">Method</th>
                        <th className="py-2.5 px-3 text-right">Target</th>
                        <th className="py-2.5 px-3 text-center">Spec Range</th>
                        <th className="py-2.5 px-3">Instrument</th>
                        <th className="py-2.5 px-3 text-center">Critical</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4E0D6]">
                      {currentPlan.params.map((p) => (
                        <tr key={p.seq} className="hover:bg-[#F6F4EF]/40 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-[#6B7280]">{p.seq}</td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-[#14213D]">{p.parameter}</div>
                            <div className="text-[10px] text-[#6B7280]">Sample: {p.sampleSize} units</div>
                          </td>
                          <td className="py-2.5 px-3 text-[#6B7280] font-mono text-[11px]">{p.method}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-right text-[#0F8B8D]">
                            {p.target} <span className="text-[10px] font-normal text-[#6B7280]">{p.uom}</span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-center text-[#14213D] text-[11px]">
                            [{p.min} &ndash; {p.max}]
                          </td>
                          <td className="py-2.5 px-3 text-[#6B7280] text-[11px]">{p.instrument}</td>
                          <td className="py-2.5 px-3 text-center">
                            {p.critical ? (
                              <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-rose-100 text-rose-800">
                                Yes
                              </span>
                            ) : (
                              <span className="text-[#6B7280] text-[11px]">&mdash;</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-[#E4E0D6]">
                <button
                  onClick={() => {
                    if (currentPlan.type === 'Incoming') onNavigate('incomingInspection');
                    else if (currentPlan.type === 'In-Process') onNavigate('spcMonitor');
                    else onNavigate('finalInspection');
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-[#0F8B8D] border border-[#0F8B8D] rounded-lg hover:bg-teal-50 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Execute Test with this Plan
                </button>
                <div className="text-[11px] text-[#6B7280]">
                  Approved for Production under ISO 9001:2015
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#6B7280] bg-white rounded-xl border border-[#E4E0D6]">
              Select an inspection plan from the list to view specifications.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
