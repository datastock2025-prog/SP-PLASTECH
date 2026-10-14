import React, { useState } from 'react';
import { NonConformanceReport, CapaReport } from '../../types';
import {
  AlertOctagon,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  HelpCircle,
  Wrench,
  FileSpreadsheet,
  Trash2,
  Edit2,
  ShieldAlert,
  Layers,
  Printer,
} from 'lucide-react';

interface Props {
  ncrs: NonConformanceReport[];
  selectedId?: string;
  onNavigate: (view: string, param?: any) => void;
  onUpdateNCR: (ncr: NonConformanceReport) => void;
  onCreateNCR: (ncr: NonConformanceReport) => void;
  onCreateCAPA: (capa: CapaReport) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
}

export const NcrManagementView: React.FC<Props> = ({
  ncrs,
  selectedId,
  onNavigate,
  onUpdateNCR,
  onCreateNCR,
  onCreateCAPA,
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  const [activeNcrId, setActiveNcrId] = useState<string>(selectedId || ncrs[0]?.id || 'NCR-2026-0114');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredNcrs = ncrs.filter((n) => {
    const matchesSev = filterSeverity === 'all' || n.severity.toLowerCase() === filterSeverity.toLowerCase();
    const matchesStatus = filterStatus === 'all' || n.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesSearch =
      n.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.lot.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSev && matchesStatus && matchesSearch;
  });

  const currentNcr = ncrs.find((n) => n.id === activeNcrId) || filteredNcrs[0] || ncrs[0];

  // Editable 5-Why State for Active NCR
  const [why1, setWhy1] = useState(currentNcr?.rca?.whys?.[0] || 'Defect observed on inspection');
  const [why2, setWhy2] = useState(currentNcr?.rca?.whys?.[1] || 'Process parameter shifted');
  const [why3, setWhy3] = useState(currentNcr?.rca?.whys?.[2] || 'Setting was not locked in recipe');
  const [rootCause, setRootCause] = useState(currentNcr?.rca?.rootCause || 'Missing recipe setpoint locking protocol');
  const [dispositionAction, setDispositionAction] = useState(currentNcr?.disposition?.action || 'Quarantine');

  const handleSaveRca = () => {
    if (!currentNcr) return;
    const updated: NonConformanceReport = {
      ...currentNcr,
      rca: {
        method: '5-Why Analysis',
        whys: [why1, why2, why3].filter(Boolean),
        rootCause,
      },
      disposition: {
        ...currentNcr.disposition,
        action: dispositionAction,
        approvedBy: 'QA Lead',
      },
      history: [
        ...currentNcr.history,
        { event: `RCA updated & Disposition set to ${dispositionAction}`, time: 'Just now' },
      ],
    };
    onUpdateNCR(updated);
    showToast(`Root Cause & Disposition updated for ${currentNcr.id}`);
  };

  const handleEscalateToCapa = () => {
    if (!currentNcr) return;
    const newCapaId = `CAPA-2026-00${40 + Math.floor(Math.random() * 50)}`;
    const newCapa: CapaReport = {
      id: newCapaId,
      source: 'NCR',
      sourceRef: currentNcr.id,
      type: 'Corrective',
      problem: currentNcr.description,
      owner: 'Quality Engineering Lead',
      priority: currentNcr.severity === 'Critical' ? 'High' : 'Medium',
      dueDate: '15 Sep 2026',
      stage: 'rootcause',
      actions: [
        {
          id: 1,
          desc: `Immediate containment verification for lot ${currentNcr.lot}`,
          owner: 'Warehouse QA',
          due: 'Tomorrow',
          status: 'done',
          evidence: 'Quarantine Bin Tag Verified',
        },
        {
          id: 2,
          desc: `Implement permanent corrective action for: ${rootCause || currentNcr.description}`,
          owner: 'Process Engineer',
          due: '10 Sep 2026',
          status: 'in_progress',
          evidence: '',
        },
      ],
      effectiveness: {
        method: 'Zero reoccurrences on next 10 production batches',
        date: '30 Sep 2026',
        result: null,
      },
      history: [{ event: `8D CAPA opened from ${currentNcr.id}`, time: 'Today' }],
    };

    onCreateCAPA(newCapa);
    const updatedNcr: NonConformanceReport = {
      ...currentNcr,
      status: 'capa_linked',
      capaId: newCapaId,
      history: [...currentNcr.history, { event: `Escalated to 8D CAPA ${newCapaId}`, time: 'Today' }],
    };
    onUpdateNCR(updatedNcr);
    showToast(`NCR escalated! Created 8D CAPA record ${newCapaId}.`);
    onNavigate('capaDetail', { id: newCapaId });
  };

  const handleOpenCreateNcr = () => {
    let item = 'FG-CTN-500';
    let itemName = 'Plastic Container 500ml';
    let lot = 'LOT-2026-091';
    let ref = 'WO-1188';
    let qty = 350;
    let severity: 'Minor' | 'Major' | 'Critical' = 'Major';
    let category = 'Process — Dimensional';
    let desc = 'Sink marks on bottom radius exceeding 0.3mm depth.';
    let containment = 'Pallet segregated in Quarantine Zone with physical red hold tag.';

    openDrawer(
      'Raise Non-Conformance Report (NCR)',
      <div className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Item Code</label>
            <input
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded font-mono"
              defaultValue={item}
              onChange={(e) => (item = e.target.value)}
            />
          </div>
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Item Name</label>
            <input
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded"
              defaultValue={itemName}
              onChange={(e) => (itemName = e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Lot / Batch #</label>
            <input
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded font-mono"
              defaultValue={lot}
              onChange={(e) => (lot = e.target.value)}
            />
          </div>
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Ref WO / PO #</label>
            <input
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded font-mono"
              defaultValue={ref}
              onChange={(e) => (ref = e.target.value)}
            />
          </div>
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Affected Quantity</label>
            <input
              type="number"
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded font-mono"
              defaultValue={qty}
              onChange={(e) => (qty = parseInt(e.target.value) || qty)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Defect Severity</label>
            <select
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded bg-white"
              defaultValue={severity}
              onChange={(e) => (severity = e.target.value as any)}
            >
              <option value="Minor">Minor (Cosmetic)</option>
              <option value="Major">Major (Out of Spec)</option>
              <option value="Critical">Critical (Safety / Function)</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Defect Category</label>
            <input
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded"
              defaultValue={category}
              onChange={(e) => (category = e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-[#14213D] mb-1">Defect Description</label>
          <textarea
            rows={2}
            className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded"
            defaultValue={desc}
            onChange={(e) => (desc = e.target.value)}
          />
        </div>

        <div>
          <label className="block font-semibold text-[#14213D] mb-1">Immediate Containment Action</label>
          <textarea
            rows={2}
            className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded"
            defaultValue={containment}
            onChange={(e) => (containment = e.target.value)}
          />
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
            const newNcr: NonConformanceReport = {
              id: `NCR-2026-0${125 + ncrs.length}`,
              source: 'Shop Floor Quality Checkpoint',
              item,
              itemName,
              ref,
              lot,
              qty,
              uom: 'PCS',
              severity,
              category,
              description: desc,
              containment,
              status: 'contained',
              discoveredBy: 'Shop Floor QA Inspector',
              discoveredDate: 'Today',
              rca: {
                method: '5-Why',
                whys: ['Defect observed during hourly production check.'],
                rootCause: 'Under 5-Why investigation.',
              },
              disposition: {
                action: 'Quarantine & MRB Review',
                qty,
                approvedBy: 'Shift Supervisor',
              },
              capaId: null,
              history: [{ event: 'NCR logged and lot placed on quarantine hold', time: 'Today' }],
            };
            onCreateNCR(newNcr);
            setActiveNcrId(newNcr.id);
            closeDrawer();
            showToast(`NCR ${newNcr.id} issued. Lot placed on quarantine hold.`);
          }}
          className="px-4 py-1.5 text-xs font-semibold bg-[#14213D] text-white rounded hover:bg-[#1f3158]"
        >
          Issue NCR
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
            Quality Management &middot; Non-Conformance &amp; Root Cause Analysis
          </div>
          <h1 className="text-2xl font-bold text-[#14213D] font-['Space_Grotesk']">
            Non-Conformance Reports (NCR)
          </h1>
          <p className="text-xs text-[#6B7280]">
            Containment protocol, 5-Why / Fishbone RCA, MRB disposition approval, and 8D CAPA escalation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreateNcr}
            className="px-3.5 py-1.5 text-xs font-semibold bg-[#14213D] text-white rounded-lg hover:bg-[#1f3158] flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-rose-400" /> + Raise NCR
          </button>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E4E0D6] shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-2.5 top-2 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Search NCRs, items, lots, root cause..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#E4E0D6] rounded-lg focus:outline-none focus:border-[#0F8B8D]"
            />
          </div>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-semibold bg-[#F6F4EF] border border-[#E4E0D6] rounded-lg"
          >
            <option value="all">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="Major">Major</option>
            <option value="Minor">Minor</option>
          </select>
        </div>
        <div className="text-xs text-[#6B7280] font-mono">
          Showing <strong>{filteredNcrs.length}</strong> non-conformance records
        </div>
      </div>

      {/* Split Layout: NCR List & Detailed RCA Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* NCR List Left Column */}
        <div className="lg:col-span-5 space-y-3">
          {filteredNcrs.map((n) => {
            const isSelected = n.id === currentNcr?.id;
            return (
              <div
                key={n.id}
                onClick={() => {
                  setActiveNcrId(n.id);
                  setWhy1(n.rca?.whys?.[0] || '');
                  setWhy2(n.rca?.whys?.[1] || '');
                  setWhy3(n.rca?.whys?.[2] || '');
                  setRootCause(n.rca?.rootCause || '');
                  setDispositionAction(n.disposition?.action || 'Quarantine');
                }}
                className={`p-4 bg-white rounded-xl border transition-all cursor-pointer shadow-sm ${
                  isSelected
                    ? 'border-[#0F8B8D] ring-2 ring-[#0F8B8D]/15'
                    : 'border-[#E4E0D6] hover:border-[#0F8B8D]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[#0F8B8D]">{n.id}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F6F4EF] text-[#6B7280]">
                      {n.source}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                      n.severity === 'Critical'
                        ? 'bg-rose-100 text-rose-800'
                        : n.severity === 'Major'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {n.severity}
                  </span>
                </div>

                <div className="font-bold text-xs text-[#14213D] mt-1.5">{n.itemName || n.item}</div>
                <div className="text-xs text-rose-600 font-medium mt-0.5 line-clamp-2">
                  {n.description}
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#6B7280] mt-3 pt-2 border-t border-[#E4E0D6]">
                  <span className="font-mono">Qty: {n.qty.toLocaleString()} {n.uom}</span>
                  <span className="font-bold uppercase text-[10px] text-teal-700">{n.status}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* RCA & Disposition Workbench Right Column */}
        <div className="lg:col-span-7">
          {currentNcr ? (
            <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm p-5 space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-[#E4E0D6] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#0F8B8D]">{currentNcr.id}</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#F6F4EF] text-[#14213D] font-bold">
                      Lot: {currentNcr.lot || '—'}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                      Status: {currentNcr.status}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-[#14213D] mt-1 font-['Space_Grotesk']">
                    {currentNcr.itemName} ({currentNcr.item})
                  </h2>
                  <p className="text-xs text-[#6B7280] font-mono mt-0.5">
                    Source: <strong>{currentNcr.source}</strong> &middot; Ref: <strong>{currentNcr.ref}</strong> &middot; Affected: <strong>{currentNcr.qty.toLocaleString()} {currentNcr.uom}</strong>
                  </p>
                </div>
                <button
                  onClick={() => showToast(`Printed Quarantine Hold Tag for ${currentNcr.id}`)}
                  className="p-2 text-[#6B7280] hover:text-[#14213D] border border-[#E4E0D6] rounded-lg hover:bg-[#F6F4EF]"
                  title="Print Hold Tag"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>

              {/* Problem & Immediate Containment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200 text-xs space-y-1">
                  <div className="font-bold text-rose-900 flex items-center gap-1.5">
                    <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                    Defect Description
                  </div>
                  <div className="text-rose-800 leading-relaxed">{currentNcr.description}</div>
                </div>

                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs space-y-1">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    Immediate Containment Action
                  </div>
                  <div className="text-amber-800 leading-relaxed">{currentNcr.containment}</div>
                </div>
              </div>

              {/* Interactive 5-Why RCA Builder */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#14213D] flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-[#0F8B8D]" />
                    5-Why Root Cause Analysis (RCA)
                  </h3>
                  <span className="text-[11px] text-[#6B7280]">Method: 5-Why Drill-Down</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-14 font-mono font-bold text-[#0F8B8D]">Why 1:</span>
                    <input
                      type="text"
                      value={why1}
                      onChange={(e) => setWhy1(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-[#E4E0D6] rounded bg-[#F6F4EF]"
                      placeholder="Why did the defect occur?"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-14 font-mono font-bold text-[#0F8B8D]">Why 2:</span>
                    <input
                      type="text"
                      value={why2}
                      onChange={(e) => setWhy2(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-[#E4E0D6] rounded bg-[#F6F4EF]"
                      placeholder="Why did the parameter deviate?"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-14 font-mono font-bold text-[#0F8B8D]">Why 3:</span>
                    <input
                      type="text"
                      value={why3}
                      onChange={(e) => setWhy3(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-[#E4E0D6] rounded bg-[#F6F4EF]"
                      placeholder="Why was there no verification checkpoint?"
                    />
                  </div>

                  <div className="pt-2">
                    <label className="block font-bold text-[#14213D] mb-1">
                      Identified Root Cause:
                    </label>
                    <textarea
                      rows={2}
                      value={rootCause}
                      onChange={(e) => setRootCause(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-[#0F8B8D] rounded bg-teal-50/40 text-[#14213D] font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* MRB Disposition Board */}
              <div className="p-4 bg-[#F6F4EF] rounded-xl border border-[#E4E0D6] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#14213D]">
                    MRB Material Disposition Decision
                  </h3>
                  <span className="text-[10px] text-[#6B7280]">Material Review Board Sign-Off</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    'Quarantine & Sort',
                    'Rework / Regrind',
                    'Return to Supplier',
                    'Scrap / Dispose',
                  ].map((act) => (
                    <button
                      key={act}
                      onClick={() => setDispositionAction(act)}
                      className={`p-2 rounded-lg text-xs font-bold border transition-colors ${
                        dispositionAction === act
                          ? 'bg-[#14213D] text-white border-[#14213D]'
                          : 'bg-white text-[#6B7280] border-[#E4E0D6] hover:border-[#14213D]'
                      }`}
                    >
                      {act}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#E4E0D6]">
                <button
                  onClick={handleEscalateToCapa}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-bold bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Wrench className="w-3.5 h-3.5" /> Escalate to 8D CAPA Initiative
                </button>

                <button
                  onClick={handleSaveRca}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-bold bg-[#0F8B8D] text-white rounded-lg hover:bg-[#0d797b] flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Save RCA &amp; Disposition
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#6B7280] bg-white rounded-xl border border-[#E4E0D6]">
              Select a Non-Conformance Report from the left to view and edit RCA.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
