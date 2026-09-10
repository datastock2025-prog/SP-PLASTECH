import React, { useState } from 'react';
import {
  Compass,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  Truck,
  Box,
  Cpu,
  FileCheck,
  ShieldAlert,
  Building,
} from 'lucide-react';
import { mockTraceabilityRecords } from '../../data/mockScmData';
import { TraceabilityRecord } from '../../types/scm';

interface ScmTrackTraceViewProps {
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const ScmTrackTraceView: React.FC<ScmTrackTraceViewProps> = ({ onNavigate, showToast }) => {
  const [searchQuery, setSearchQuery] = useState('LOT-2026-08-PP990');
  const [selectedRecord, setSelectedRecord] = useState<TraceabilityRecord | null>(mockTraceabilityRecords[0]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = mockTraceabilityRecords.find(
      (r) =>
        r.lotNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.finishedGoodLot.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.itemCode.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (found) {
      setSelectedRecord(found);
      showToast(`Found 360° Geneaology Trail for ${found.lotNumber}`);
    } else {
      showToast(`No traceability records found matching "${searchQuery}"`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono text-xs font-semibold uppercase">
              360° Forward &amp; Backward Geneaology
            </span>
            <span className="text-xs text-slate-500">· Polymer Resin Lot to Customer Assembly Line</span>
          </div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D] mt-1">
            End-to-End Supply Chain Track &amp; Trace Command
          </h1>
          <p className="text-slate-500 text-xs">
            Instant audit trail linking raw material resin batch COA, dryer moisture logs, injection mold cavity numbers, QC inspection certificates, and dispatch serials.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Enter Resin Lot / FG Lot / PO..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs w-64 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Trace 360°
          </button>
        </form>
      </div>

      {/* Geneaology Visualizer */}
      {selectedRecord ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-mono text-slate-400">Traceability Record ID</span>
              <h2 className="text-lg font-bold font-['Space_Grotesk'] text-[#14213D]">
                {selectedRecord.lotNumber} → {selectedRecord.finishedGoodLot}
              </h2>
              <p className="text-xs text-slate-500">{selectedRecord.itemName} ({selectedRecord.itemCode})</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold font-mono">
                {selectedRecord.qcInspectionStatus}
              </span>
            </div>
          </div>

          {/* 5-Stage Geneaology Flow */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {/* Step 1: Raw Polymer Material */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 relative">
              <div className="flex items-center gap-2 text-[#0F8B8D] font-bold text-xs">
                <Box className="w-4 h-4" />
                <span>1. Raw Resin Lot</span>
              </div>
              <div className="text-xs space-y-1">
                <div className="font-mono font-bold text-slate-900">{selectedRecord.lotNumber}</div>
                <div className="text-slate-600">{selectedRecord.supplier}</div>
                <div className="text-[11px] font-mono text-[#0F8B8D]">{selectedRecord.resinGrade}</div>
                <div className="text-[10px] text-slate-400">COA: Verified Grade</div>
              </div>
            </div>

            {/* Step 2: Inbound Receipt & QC */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                <FileCheck className="w-4 h-4" />
                <span>2. Receipt &amp; QC</span>
              </div>
              <div className="text-xs space-y-1">
                <div className="font-mono text-slate-900">{selectedRecord.inboundPo}</div>
                <div className="text-slate-600">GRN-2026-08-991</div>
                <div className="text-emerald-600 font-bold text-[11px]">MFI &amp; Moisture Passed</div>
                <div className="text-[10px] text-slate-400">Silo Location: SILO-01</div>
              </div>
            </div>

            {/* Step 3: Production & Tooling */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-amber-700 font-bold text-xs">
                <Cpu className="w-4 h-4" />
                <span>3. IMM Press &amp; Mold</span>
              </div>
              <div className="text-xs space-y-1">
                <div className="font-mono font-bold text-slate-900">{selectedRecord.productionBatch}</div>
                <div className="text-slate-600">Machine: {selectedRecord.machineNumber}</div>
                <div className="text-slate-600">Tool: {selectedRecord.moldId}</div>
                <div className="text-[10px] text-slate-400">Cycle Time: 42s</div>
              </div>
            </div>

            {/* Step 4: Finished Goods Staging */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-purple-700 font-bold text-xs">
                <Layers className="w-4 h-4" />
                <span>4. FG Quality Release</span>
              </div>
              <div className="text-xs space-y-1">
                <div className="font-mono font-bold text-slate-900">{selectedRecord.finishedGoodLot}</div>
                <div className="text-emerald-700 font-bold text-[11px]">{selectedRecord.qcInspectionStatus}</div>
                <div className="text-slate-600">CMM Dimensional: 100%</div>
                <div className="text-[10px] text-slate-400">Pallet: PAL-8821</div>
              </div>
            </div>

            {/* Step 5: Customer Delivery */}
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                <Truck className="w-4 h-4" />
                <span>5. Outbound JIT Dispatch</span>
              </div>
              <div className="text-xs space-y-1">
                <div className="font-bold text-slate-900">{selectedRecord.customer}</div>
                <div className="font-mono text-slate-800">{selectedRecord.dispatchInvoice}</div>
                <div className="text-emerald-700 font-bold text-[11px]">Delivery Confirmed</div>
                <div className="text-[10px] text-slate-500">e-POD Signed by Gate 2</div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 text-xs text-slate-700 space-y-1">
            <h4 className="font-bold text-blue-950 font-['Space_Grotesk']">Traceability Audit Certification</h4>
            <p>
              This batch fulfills Automotive IATF 16949 Section 8.5.2 (Identification and Traceability) and ISO 9001:2015 strict geneaology standards. Full digital certificates and mold runner regrind blend logs (15% internal closed-loop) are encrypted and verified.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
          Search for a lot number to view the 360° geneaology visualization.
        </div>
      )}
    </div>
  );
};
