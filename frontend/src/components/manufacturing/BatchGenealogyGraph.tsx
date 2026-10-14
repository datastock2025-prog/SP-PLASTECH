import React, { useState } from 'react';
import { WorkOrder, ItemMaster } from '../../types';
import {
  GitBranch,
  ArrowRight,
  Search,
  AlertTriangle,
  CheckCircle2,
  Package,
  Layers,
  Sparkles,
  ShieldAlert,
  Truck,
  ExternalLink
} from 'lucide-react';

interface GenealogyProps {
  workOrders: WorkOrder[];
  items: ItemMaster[];
  selectedWoId?: string;
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const BatchGenealogyGraph: React.FC<GenealogyProps> = ({
  workOrders,
  items,
  selectedWoId = 'WO-1188',
  onNavigate,
  showToast,
}) => {
  const [selectedWO, setSelectedWO] = useState<string>(selectedWoId);
  const [traceDirection, setTraceDirection] = useState<'backward' | 'forward'>('backward');
  const [highlightedLot, setHighlightedLot] = useState<string | null>(null);

  const currentWO = workOrders.find((w) => w.id === selectedWO) || workOrders[0];
  const itemName = (code: string) => items.find((i) => i.code === code)?.name || code;

  // 4-Tier Traceability Nodes
  const genealogyTree = {
    tier1_rawMaterials: [
      { code: 'RM-PP-NAT-001', lot: 'LOT-001-01', vendor: 'Reliance Polymers', coa: 'COA-8841', status: 'Passed QA' },
      { code: 'MB-WHT-002', lot: 'LOT-MB-00456', vendor: 'Clariant Masterbatches', coa: 'COA-9120', status: 'Passed QA' },
      { code: 'RG-PP-011', lot: 'RG-00321', vendor: 'In-House Regrind Bay', coa: 'COA-RG-11', status: 'Internal' }
    ],
    tier2_production: {
      wo: currentWO?.id || 'WO-1188',
      machine: currentWO?.machine || 'IMM-250T-03',
      mold: currentWO?.mold || 'MLD-1001',
      operator: currentWO?.operator || 'R. Kumar',
      date: currentWO?.planDate || '2026-08-28',
      outputGood: currentWO?.completed || 6240,
      scrap: currentWO?.scrap || 112
    },
    tier3_finishedBatch: {
      batchNo: 'BATCH-20260828-A1',
      item: currentWO?.item || 'FG-CTN-500',
      itemName: itemName(currentWO?.item || ''),
      warehouseBin: 'FG-WH-01-A1',
      qaRelease: 'Approved (Dr. Kavita Menon)'
    },
    tier4_customers: [
      { so: 'SO-4401', customer: 'Nestle India Pvt Ltd', shipDate: '2026-08-29', qty: 4000, invoice: 'INV-9021', status: 'Shipped' },
      { so: 'SO-4409', customer: 'Britannia Industries', shipDate: '2026-08-30', qty: 2240, invoice: 'INV-9034', status: 'Staged' }
    ]
  };

  const handleSimulateRecallCheck = () => {
    showToast('Recall Impact Simulation: 2 Sales Orders & 1 Finished Goods batch mapped for containment.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E4E0D6] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#0F8B8D]/10 text-[#0F8B8D]">
              End-to-End Lot Traceability
            </span>
            <span className="text-[11px] text-[#6B7280]">
              4-Tier Directed Genealogy Graph &bull; Recall Impact Calculator
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#14213D]">Batch Genealogy &amp; Lot Traceability</h1>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedWO}
            onChange={(e) => setSelectedWO(e.target.value)}
            className="p-2.5 rounded-xl border border-[#E4E0D6] bg-white font-bold text-xs text-[#14213D]"
          >
            {workOrders.map((w) => (
              <option key={w.id} value={w.id}>{w.id} &mdash; {itemName(w.item)}</option>
            ))}
          </select>

          <button
            onClick={handleSimulateRecallCheck}
            className="px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <ShieldAlert className="w-4 h-4" />
            Simulate Recall Containment
          </button>
        </div>
      </div>

      {/* 4-Tier Interactive Directed Graph Flow */}
      <div className="bg-white rounded-2xl border border-[#E4E0D6] p-6 shadow-xs space-y-6 overflow-x-auto">
        <div className="flex items-center justify-between text-xs font-bold text-[#6B7280] pb-2 border-b border-[#E4E0D6] min-w-[900px]">
          <span>TIER 1: RAW MATERIAL LOTS</span>
          <span>TIER 2: MES PRODUCTION WORK ORDER</span>
          <span>TIER 3: FINISHED GOODS BATCH</span>
          <span>TIER 4: CUSTOMER SHIPMENTS</span>
        </div>

        <div className="grid grid-cols-4 gap-4 min-w-[900px] relative items-center">
          {/* Tier 1: Raw Materials */}
          <div className="space-y-3">
            {genealogyTree.tier1_rawMaterials.map((rm, idx) => (
              <div
                key={idx}
                onClick={() => setHighlightedLot(rm.lot)}
                className={`p-3.5 rounded-2xl border text-xs space-y-1 cursor-pointer transition-all hover:scale-102 ${
                  highlightedLot === rm.lot ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-500/20' : 'bg-[#F6F4EF] border-[#E4E0D6]'
                }`}
              >
                <div className="font-mono font-bold text-[#0F8B8D]">{rm.lot}</div>
                <div className="font-semibold text-[#14213D]">{rm.code}</div>
                <div className="text-[10px] text-[#6B7280]">{rm.vendor} &bull; COA: {rm.coa}</div>
              </div>
            ))}
          </div>

          {/* Tier 2: Production WO */}
          <div>
            <div className="p-4 rounded-2xl bg-teal-50/60 border-2 border-[#0F8B8D] text-xs space-y-2 shadow-xs">
              <div className="flex justify-between items-center">
                <span className="font-mono font-bold text-sm text-[#0F8B8D]">{genealogyTree.tier2_production.wo}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Processed</span>
              </div>
              <div className="text-[#14213D] font-semibold">
                Bay: <b>{genealogyTree.tier2_production.machine}</b>
              </div>
              <div className="text-[11px] text-[#6B7280]">
                Mold: {genealogyTree.tier2_production.mold} &bull; Op: {genealogyTree.tier2_production.operator}
              </div>
              <div className="pt-1 border-t border-teal-200 flex justify-between font-mono text-[11px]">
                <span className="text-emerald-700">Good: {genealogyTree.tier2_production.outputGood}</span>
                <span className="text-rose-700">Scrap: {genealogyTree.tier2_production.scrap}</span>
              </div>
            </div>
          </div>

          {/* Tier 3: FG Batch */}
          <div>
            <div className="p-4 rounded-2xl bg-[#F6F4EF] border border-[#E4E0D6] text-xs space-y-2 shadow-xs">
              <div className="font-mono font-bold text-sm text-[#14213D]">{genealogyTree.tier3_finishedBatch.batchNo}</div>
              <div className="font-semibold text-[#14213D]">{genealogyTree.tier3_finishedBatch.itemName}</div>
              <div className="text-[11px] text-[#6B7280]">
                Warehouse Bin: <b className="font-mono text-[#14213D]">{genealogyTree.tier3_finishedBatch.warehouseBin}</b>
              </div>
              <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 p-1.5 rounded-lg border border-emerald-200">
                {genealogyTree.tier3_finishedBatch.qaRelease}
              </div>
            </div>
          </div>

          {/* Tier 4: Customers / Shipments */}
          <div className="space-y-3">
            {genealogyTree.tier4_customers.map((cust, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-200 text-xs space-y-1">
                <div className="flex justify-between font-bold text-blue-950">
                  <span>{cust.customer}</span>
                  <span className="font-mono">{cust.so}</span>
                </div>
                <div className="text-[11px] text-blue-800">
                  Qty: {cust.qty.toLocaleString()} pcs &bull; Shipped: {cust.shipDate}
                </div>
                <div className="text-[10px] font-mono text-blue-700">
                  Invoice: {cust.invoice} &bull; Status: {cust.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
