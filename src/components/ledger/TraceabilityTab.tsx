// ============================================================================
// TAB 9: END-TO-END TRACEABILITY & TRANSACTION LINEAGE
// Step-13 Specification: Universal Search, Forward/Backward Trace Graph, Node Drawer
// ============================================================================

import React, { useState } from 'react';
import {
  GitMerge,
  Search,
  Layers,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building,
  DollarSign,
  FileSpreadsheet,
  Boxes,
  ShoppingCart,
  Receipt,
  ShieldCheck,
  Truck,
  BookOpen,
} from 'lucide-react';
import { LineageNode, DocumentAccountingImpact } from '../../types/unifiedLedgerTypes';
import { mockLineageNodes, mockLineageEdges } from '../../data/unifiedLedgerData';

interface Props {
  onOpenAccountingImpact: (impact: DocumentAccountingImpact) => void;
  onOpenDocPreview: (docType: string, docNumber: string, data: any) => void;
  selectedIdentifier?: string;
}

export const TraceabilityTab: React.FC<Props> = ({
  onOpenAccountingImpact,
  onOpenDocPreview,
  selectedIdentifier = 'PO-2026-0842',
}) => {
  const [searchInput, setSearchInput] = useState<string>(selectedIdentifier);
  const [traceDirection, setTraceDirection] = useState<'forward' | 'backward'>('forward');
  const [selectedNode, setSelectedNode] = useState<LineageNode>(mockLineageNodes[0]);

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'PO':
        return ShoppingCart;
      case 'GRN':
        return Receipt;
      case 'QC':
        return ShieldCheck;
      case 'Stock':
        return Boxes;
      case 'Dispatch':
        return Truck;
      case 'Invoice':
        return FileSpreadsheet;
      case 'Journal':
        return BookOpen;
      default:
        return Layers;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Universal Trace Search */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-bold">
                Step-13 Traceability Engine
              </span>
              <span className="text-xs text-slate-400">Cryptographic Operations ⟷ GL Linkage</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Universal Document & Financial Lineage Explorer
            </h2>
            <p className="text-xs text-slate-500">
              Enter ANY identifier to reconstruct the complete upstream & downstream lifecycle from purchase to GL balance.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Trace Mode:</span>
            <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-lg flex gap-1">
              <button
                onClick={() => setTraceDirection('forward')}
                className={`px-3 py-1 rounded font-semibold transition ${
                  traceDirection === 'forward'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Forward Trace (PO → Payment)
              </button>
              <button
                onClick={() => setTraceDirection('backward')}
                className={`px-3 py-1 rounded font-semibold transition ${
                  traceDirection === 'backward'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Backward Audit (JE → Raw Stock)
              </button>
            </div>
          </div>
        </div>

        {/* Universal Search Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search PO (PO-2026-0842), GRN (GRN-2026-0412), Batch (LOT-MB-RED-09), Invoice, or JE..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-purple-500"
            />
          </div>
          <button className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-xs">
            Generate Lineage Map
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
          <span className="font-semibold text-slate-400">Sample Cycles:</span>
          {[
            { label: 'Procure-to-Pay (PO-2026-0842)', id: 'PO-2026-0842' },
            { label: 'Dock Inward (GRN-2026-0412)', id: 'GRN-2026-0412' },
            { label: 'QC Quarantine (LOT-MB-RED-09)', id: 'LOT-MB-RED-09' },
            { label: 'Order-to-Cash (DSP-2026-0511)', id: 'DSP-2026-0511' },
            { label: 'Tax Bill (INV-SUP-7721)', id: 'INV-SUP-7721' },
          ].map((sample) => (
            <button
              key={sample.id}
              onClick={() => {
                setSearchInput(sample.id);
                const match = mockLineageNodes.find((n) => (n.documentNumber || n.docNumber || '').includes(sample.id));
                if (match) setSelectedNode(match);
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-purple-50 dark:bg-slate-800 dark:hover:bg-purple-950/40 rounded-lg text-slate-700 dark:text-slate-300 font-mono transition"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Lineage Pipeline */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              {traceDirection === 'forward' ? 'Downstream Impact Pipeline' : 'Upstream Origin Audit Path'}
            </h3>
            <p className="text-[11px] text-slate-500">
              Click any stage in the flow below to inspect its operational data, batches, and double-entry postings
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-purple-600 bg-purple-50 dark:bg-purple-950 px-2.5 py-1 rounded-md">
            {mockLineageNodes.length} Verified Link Nodes
          </span>
        </div>

        {/* Pipeline Horizontal Flow (Interactive Nodes) */}
        <div className="flex items-center gap-3 overflow-x-auto pb-4 pt-2">
          {mockLineageNodes.map((node, index) => {
            const Icon = getNodeIcon(node.type);
            const isSelected = selectedNode.id === node.id;
            return (
              <React.Fragment key={node.id}>
                {/* Node Box */}
                <div
                  onClick={() => setSelectedNode(node)}
                  className={`shrink-0 w-60 p-4 rounded-xl border transition cursor-pointer shadow-xs ${
                    isSelected
                      ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/20'
                      : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Stage 0{index + 1}: {node.type}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                      {node.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 text-purple-600 flex items-center justify-center shadow-xs">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                        {node.documentNumber || node.docNumber}
                      </div>
                      <div className="text-[10px] text-slate-400">{node.date}</div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 dark:text-slate-300 truncate mb-1">
                    {node.party || node.partyOrItem}
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-200 dark:border-slate-700/60">
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {node.amount ? `₹${node.amount.toLocaleString('en-IN')}` : node.amountOrQty}
                    </span>
                    <span className="text-purple-600 dark:text-purple-400 font-semibold text-[10px]">
                      Inspect →
                    </span>
                  </div>
                </div>

                {/* Connector Arrow */}
                {index < mockLineageNodes.length - 1 && (
                  <div className="shrink-0 text-slate-300 dark:text-slate-700">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Selected Node Details Card (Step-13 Specification) */}
        <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold">
                <GitMerge className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {selectedNode.type} Node: {selectedNode.documentNumber || selectedNode.docNumber}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {selectedNode.status}
                  </span>
                </div>
                <p className="text-slate-500">
                  Party: {selectedNode.party || selectedNode.partyOrItem} • Date: {selectedNode.date} • Financial Exposure: {selectedNode.amount ? `₹${selectedNode.amount.toLocaleString('en-IN')}` : selectedNode.amountOrQty}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenDocPreview(selectedNode.type, selectedNode.documentNumber || selectedNode.docNumber, {})}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-xs hover:bg-slate-100 flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open Full Document View
              </button>
              <button
                onClick={() =>
                  onOpenAccountingImpact({
                    documentType: selectedNode.type as any,
                    documentNumber: selectedNode.documentNumber || selectedNode.docNumber,
                    postingDate: selectedNode.date,
                    status: 'Posted',
                    totalDebit: selectedNode.amount || 0,
                    totalCredit: selectedNode.amount || 0,
                    lines: [
                      {
                        id: 'lin-1',
                        lineNo: 1,
                        accountCode: '1310-00',
                        accountName: 'Stock / Material Control A/C',
                        accountType: 'Asset',
                        debit: selectedNode.amount || 0,
                        credit: 0,
                      },
                      {
                        id: 'lin-2',
                        lineNo: 2,
                        accountCode: '2120-00',
                        accountName: 'GRNI / Accrual Offset',
                        accountType: 'Liability',
                        debit: 0,
                        credit: selectedNode.amount || 0,
                      },
                    ],
                  })
                }
                className="px-3 py-1.5 bg-[#E8622C] hover:bg-[#d55320] text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
              >
                <Layers className="w-3.5 h-3.5" /> View Double-Entry Ledger Impact
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-slate-400 block text-[11px] mb-1">Upstream Predecessors</span>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-blue-600">
                PO-2026-0842 (Reliance Industries)
              </div>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] mb-1">Downstream Successors</span>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-purple-600">
                QC-2026-0189 ⟷ INV-SUP-7721
              </div>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] mb-1">General Ledger Voucher #</span>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-emerald-600 font-bold">
                JE-2026-0920 (Balanced Dr/Cr)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
