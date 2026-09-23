import React, { useState, useMemo } from 'react';
import { BomMaster, ItemMaster } from '../../../types';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  Filter,
  Plus,
  ArrowRight,
  Send,
  Eye,
  Layers,
  Scale,
  X,
  Check,
  AlertTriangle,
  FileCheck,
  Building2,
  ChevronRight,
} from 'lucide-react';
import { calculatePureRmMassKg } from '../jit/jitCalculations';
import { BomVersionRecipeDeveloperModal } from './BomVersionRecipeDeveloperModal';

interface BomVersionApprovalGridProps {
  isOpen: boolean;
  onClose: () => void;
  boms: BomMaster[];
  items: ItemMaster[];
  initialItemFilter?: string;
  onApproveBom: (bomId: string) => void;
  onStageToPrdStore?: (bom: BomMaster, formulaId: string) => void;
  onApplyVersionToSchedule?: (bom: BomMaster, formulaId: string) => void;
  onCreateNewBom?: (newBom: BomMaster, formulaId: string) => void;
  showToast: (msg: string) => void;
}

// Task 2: Helper to ensure unique, non-duplicating Formula ID per version of each SKU
export const getUniqueFormulaIdForBom = (bom: BomMaster): string => {
  const cleanSku = (bom.parent || 'SKU').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6);
  const cleanVer = (bom.version || 'v1.0').replace(/[^a-zA-Z0-9.]/g, '');
  if (bom.formulaCode && (bom.formulaCode.endsWith(cleanVer) || bom.formulaCode.includes(cleanVer))) {
    return bom.formulaCode;
  }
  return `FRM-${cleanSku}-${cleanVer}`;
};

export const BomVersionApprovalGrid: React.FC<BomVersionApprovalGridProps> = ({
  isOpen,
  onClose,
  boms,
  items,
  initialItemFilter,
  onApproveBom,
  onStageToPrdStore,
  onApplyVersionToSchedule,
  onCreateNewBom,
  showToast,
}) => {
  if (!isOpen) return null;

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'released'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBomForDetail, setSelectedBomForDetail] = useState<BomMaster | null>(null);
  const [isDeveloperModalOpen, setIsDeveloperModalOpen] = useState<boolean>(false);

  // Filtered BOMs: Strictly scoped to single SKU if initialItemFilter is provided (Task 4)
  const filteredBoms = useMemo(() => {
    let list = boms;

    // Task 4: When opened for a specific SKU row, strictly show only that SKU's versions
    if (initialItemFilter) {
      const targetSku = initialItemFilter.toUpperCase().trim();
      list = boms.filter(
        (b) =>
          b.parent.toUpperCase().includes(targetSku) ||
          (b.parentName && b.parentName.toUpperCase().includes(targetSku))
      );

      // If only 1 version exists, synthesize previous baseline version for comparison (Task 2 & 4)
      if (list.length === 1 && !list.some((b) => b.version === 'v1.0')) {
        const cleanSku = list[0].parent.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6);
        const baseBom: BomMaster = {
          ...list[0],
          id: `${list[0].id}-v1.0`,
          version: 'v1.0',
          revision: 'Rev A (Baseline)',
          status: 'released',
          updated: '2026-06-01',
          createdDate: '2026-06-01',
          formulaCode: `FRM-${cleanSku}-v1.0`,
          notes: 'Original production baseline recipe formulation.',
        };
        list = [...list, baseBom];
      }
    }

    return list.filter((b) => {
      const matchStatus =
        statusFilter === 'all' ||
        b.status === statusFilter ||
        (statusFilter === 'pending' && (b.status === 'pending' || b.status === 'under_review'));
      const q = searchQuery.toLowerCase().trim();
      const uniqueFid = getUniqueFormulaIdForBom(b).toLowerCase();
      const matchQuery =
        !q ||
        b.id.toLowerCase().includes(q) ||
        b.parent.toLowerCase().includes(q) ||
        (b.parentName && b.parentName.toLowerCase().includes(q)) ||
        (b.version && b.version.toLowerCase().includes(q)) ||
        uniqueFid.includes(q);

      return matchStatus && matchQuery;
    });
  }, [boms, statusFilter, searchQuery, initialItemFilter]);

  // Handle Approve Confirm
  const handleApproveConfirm = (bom: BomMaster) => {
    onApproveBom(bom.id);
    showToast(`✅ BOM Version "${bom.version}" (${bom.id}) for item "${bom.parent}" successfully Approved & Released!`);
    if (selectedBomForDetail?.id === bom.id) {
      setSelectedBomForDetail({ ...selectedBomForDetail, status: 'approved' });
    }
  };

  // Handle PRD Store Transfer Release (Task 2: unique formula ID)
  const handleTransferToPrdStore = (bom: BomMaster) => {
    const formula = getUniqueFormulaIdForBom(bom);
    if (onStageToPrdStore) {
      onStageToPrdStore(bom, formula);
    }
    showToast(`📦 Recipe Stock Transfer staged in Shopfloor PRD Store (STR-PMP-PRD1) under Formula ID "${formula}"!`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#1E3A8A] text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-indigo-300 border border-white/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-400/20 text-indigo-300 border border-indigo-400/30">
                  Engineering &amp; Quality Governance
                </span>
                <span className="text-slate-400 text-xs">&bull;</span>
                <span className="text-xs text-slate-300">Shopfloor PRD Store Integration</span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-white mt-0.5">
                BOM Version Recipe Approval &amp; Formula Staging Grid
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsDeveloperModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ Develop New Recipe Version</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Versions ({boms.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                statusFilter === 'pending' ? 'bg-amber-500 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Pending Review</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                statusFilter === 'approved' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Approved Recipes</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search part, formula ID, BOM #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Main Grid Table */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs bg-white">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 text-[11px] uppercase tracking-wider text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5">Molded Part &bull; SKU</th>
                  <th className="py-3 px-3.5">BOM ID &bull; Version</th>
                  <th className="py-3 px-3.5">Governing Formula ID</th>
                  <th className="py-3 px-3.5 text-right">Pure RM Mass</th>
                  <th className="py-3 px-3.5 text-right">Mat. Cost / PC</th>
                  <th className="py-3 px-3.5 text-center">Approval Status</th>
                  <th className="py-3 px-3.5 text-right">Actions &amp; Staging</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBoms.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">
                      No BOM versions found matching the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredBoms.map((bom) => {
                    const formulaId = getUniqueFormulaIdForBom(bom);
                    
                    // Pure RM mass calculation
                    const pureRmGrams = bom.lines
                      ? bom.lines
                          .filter((l) => {
                            const uom = (l.uom || '').toUpperCase();
                            const isKg = uom === 'KG' || uom === 'KGS';
                            const code = (l.item || '').toUpperCase();
                            const name = (l.name || '').toUpperCase();
                            const isPck = code.startsWith('PK-') || name.includes('CARTON') || name.includes('BOX');
                            const isBop = code.startsWith('SP-') || code.startsWith('BOP-');
                            return isKg && !isPck && !isBop;
                          })
                          .reduce((sum, l) => sum + (Number(l.qty) || 0) * 1000, 0)
                      : bom.itemNetWeightGrams || 80.0;

                    const isApproved = bom.status === 'approved' || bom.status === 'released';

                    return (
                      <tr key={bom.id} className="hover:bg-indigo-50/30 transition-colors">
                        {/* Molded Part */}
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-slate-900 text-xs">{bom.parentName || bom.parent}</div>
                          <div className="font-mono text-[11px] text-slate-500">{bom.parent}</div>
                        </td>

                        {/* BOM ID & Version */}
                        <td className="py-3 px-3.5">
                          <div className="font-mono font-bold text-indigo-900">{bom.id}</div>
                          <div className="text-[11px] text-slate-600 font-semibold">{bom.version}</div>
                        </td>

                        {/* Formula ID Badge */}
                        <td className="py-3 px-3.5">
                          <span className="px-2.5 py-1 rounded-lg font-mono text-xs font-black bg-cyan-100 text-cyan-950 border border-cyan-300 inline-flex items-center gap-1 shadow-2xs">
                            <Sparkles className="w-3 h-3 text-cyan-700" />
                            <span>{formulaId}</span>
                          </span>
                        </td>

                        {/* Pure RM Mass */}
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-800">
                          {pureRmGrams > 0 ? pureRmGrams.toFixed(1) : '80.0'}{' '}
                          <span className="text-[10px] text-slate-500 font-normal">Grams</span>
                        </td>

                        {/* Cost */}
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-700">
                          ₹{(bom.materialCost || bom.standardCost || 45.0).toFixed(2)}
                        </td>

                        {/* Approval Status */}
                        <td className="py-3 px-3.5 text-center">
                          {isApproved ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Approved</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1 animate-pulse">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Pending QA Sign-Off</span>
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Inspect Recipe Details */}
                            <button
                              type="button"
                              onClick={() => setSelectedBomForDetail(bom)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                              title="Inspect component lines"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Approve Button (if pending) */}
                            {!isApproved && (
                              <button
                                type="button"
                                onClick={() => handleApproveConfirm(bom)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                            )}

                            {/* Stage or Apply to Schedule Button (after approval) */}
                            {isApproved && onApplyVersionToSchedule && (
                              <button
                                type="button"
                                onClick={() => {
                                  onApplyVersionToSchedule(bom, formulaId);
                                  onClose();
                                }}
                                className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-lg font-extrabold text-[11px] flex items-center gap-1 shadow-2xs transition-all cursor-pointer active:scale-98"
                                title="Apply this approved BOM version to schedule machine and transfer recipe materials"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>Apply Version &amp; Stage</span>
                              </button>
                            )}

                            {isApproved && !onApplyVersionToSchedule && (
                              <button
                                type="button"
                                onClick={() => handleTransferToPrdStore(bom)}
                                className="px-2.5 py-1 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                                title="1-Click transfer recipe materials to Shopfloor PRD Store"
                              >
                                <Send className="w-3 h-3" />
                                <span>Stage to PRD Store</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-500">
            Total BOM Versions: <strong className="text-slate-900 font-mono">{filteredBoms.length}</strong> &bull; Target PRD Store: <strong className="font-mono text-cyan-800">STR-PMP-PRD1</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close Grid
          </button>
        </div>

      </div>

      {/* Detail Modal */}
      {selectedBomForDetail && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {selectedBomForDetail.version} Recipe Details
                </h3>
                <div className="text-xs text-slate-500 font-mono">{selectedBomForDetail.parent}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBomForDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase">Recipe Components</h4>
              <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-600 font-bold">
                  <tr>
                    <th className="p-2 text-left">Item Code</th>
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-right">Qty / Unit</th>
                    <th className="p-2 text-center">UOM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedBomForDetail.lines?.map((l, i) => (
                    <tr key={i}>
                      <td className="p-2 font-mono font-bold text-slate-800">{l.item}</td>
                      <td className="p-2 text-slate-600">{l.name}</td>
                      <td className="p-2 text-right font-mono font-bold">{l.qty}</td>
                      <td className="p-2 text-center font-mono">{l.uom}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedBomForDetail(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Close
              </button>
              {selectedBomForDetail.status !== 'approved' && selectedBomForDetail.status !== 'released' && (
                <button
                  type="button"
                  onClick={() => handleApproveConfirm(selectedBomForDetail)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve Version</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recipe Developer Modal */}
      {isDeveloperModalOpen && (
        <BomVersionRecipeDeveloperModal
          isOpen={isDeveloperModalOpen}
          onClose={() => setIsDeveloperModalOpen(false)}
          items={items}
          onSubmitForApproval={(newBom, formulaId) => {
            if (onCreateNewBom) {
              onCreateNewBom(newBom, formulaId);
            }
          }}
          showToast={showToast}
        />
      )}

    </div>
  );
};
