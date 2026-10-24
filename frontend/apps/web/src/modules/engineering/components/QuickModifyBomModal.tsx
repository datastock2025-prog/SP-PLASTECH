import React, { useState, useEffect } from 'react';
import { BomMaster, BomLine, ItemMaster, ApprovalStatus } from '@/src/types';
import { Edit2, X, Fingerprint, Layers, FolderTree, Check } from 'lucide-react';
import { masterDataGovernanceService } from '@/src/services/masterDataGovernanceService';

export interface QuickModifyBomModalProps {
  bom: BomMaster | null;
  items: ItemMaster[];
  onClose: () => void;
  onSave: (updated: BomMaster) => void;
  onNavigate: (view: string, param?: any) => void;
  onOpenWizard: (item: ItemMaster) => void;
  showToast: (msg: string) => void;
}

export const QuickModifyBomModal: React.FC<QuickModifyBomModalProps> = ({
  bom: initialBom,
  items,
  onClose,
  onSave,
  onNavigate,
  onOpenWizard,
  showToast,
}) => {
  const [quickModifyBom, setQuickModifyBom] = useState<BomMaster | null>(initialBom);

  useEffect(() => {
    setQuickModifyBom(initialBom);
  }, [initialBom]);

  if (!quickModifyBom) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#E4E0D6] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#E4E0D6] bg-gradient-to-r from-[#14213D] to-[#1a2f58] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Edit2 className="w-5 h-5 text-[#E8622C]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#E8622C] font-bold uppercase tracking-wider">
                  Quick Modify BOM Recipe
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 border border-white/20 text-white">
                  {quickModifyBom.id}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                {quickModifyBom.parentName}
                <span className="text-xs text-gray-300 font-mono font-normal">({quickModifyBom.parent})</span>
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 [scrollbar-width:thin]">
          {/* Lifecycle & Status Bar */}
          <div className="p-3.5 bg-[#F9F8F5] rounded-xl border border-[#E4E0D6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-[#14213D] block">Recipe Approval Lifecycle State</span>
              <span className="text-[11px] text-gray-500">Update governance stage for shop floor release</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['draft', 'under_review', 'approved', 'released', 'obsolete'] as ApprovalStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setQuickModifyBom({ ...quickModifyBom, status: st })}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize border transition-all ${
                    quickModifyBom.status === st
                      ? 'bg-[#14213D] text-white border-[#14213D] shadow-xs'
                      : 'bg-white text-gray-600 border-[#E4E0D6] hover:border-gray-400'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Core Parameters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
            <div>
              <label className="text-xs font-bold text-[#14213D] block mb-1">BOM Version</label>
              <input
                type="text"
                value={quickModifyBom.version || 'v1.0'}
                onChange={(e) => setQuickModifyBom({ ...quickModifyBom, version: e.target.value })}
                className="w-full py-2 px-3 border border-[#E4E0D6] rounded-lg font-mono text-xs focus:border-[#0F8B8D] outline-none"
                placeholder="e.g. v1.0"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#14213D] block mb-1">Process Type</label>
              <select
                value={quickModifyBom.processType || 'Injection Molding'}
                onChange={(e) => setQuickModifyBom({ ...quickModifyBom, processType: e.target.value as any })}
                className="w-full py-2 px-3 border border-[#E4E0D6] rounded-lg text-xs focus:border-[#0F8B8D] outline-none bg-white"
              >
                <option value="Injection Molding">Injection Molding</option>
                <option value="Blow Molding">Blow Molding</option>
                <option value="Compression Molding">Compression Molding</option>
                <option value="Extrusion">Extrusion</option>
                <option value="Assembly">Assembly</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#14213D] block mb-1">Batch Size ({quickModifyBom.baseUOM || 'PCS'})</label>
              <input
                type="number"
                value={quickModifyBom.batchSize || 1000}
                onChange={(e) => setQuickModifyBom({ ...quickModifyBom, batchSize: parseFloat(e.target.value) || 0 })}
                className="w-full py-2 px-3 border border-[#E4E0D6] rounded-lg font-mono text-xs focus:border-[#0F8B8D] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#14213D] block mb-1">Standard Unit Cost (₹)</label>
              <input
                type="number"
                step="0.01"
                value={quickModifyBom.standardCost || 0}
                onChange={(e) => setQuickModifyBom({ ...quickModifyBom, standardCost: parseFloat(e.target.value) || 0 })}
                className="w-full py-2 px-3 border border-[#E4E0D6] rounded-lg font-mono font-bold text-xs focus:border-[#0F8B8D] outline-none text-[#14213D]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#14213D] block mb-1">Target Yield (%)</label>
              <input
                type="number"
                step="0.1"
                value={quickModifyBom.yieldPct || 98.5}
                onChange={(e) => setQuickModifyBom({ ...quickModifyBom, yieldPct: parseFloat(e.target.value) || 0 })}
                className="w-full py-2 px-3 border border-[#E4E0D6] rounded-lg font-mono text-xs focus:border-[#0F8B8D] outline-none text-emerald-700 font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#14213D] block mb-1">Scrap Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={quickModifyBom.scrapPct || 1.5}
                onChange={(e) => setQuickModifyBom({ ...quickModifyBom, scrapPct: parseFloat(e.target.value) || 0 })}
                className="w-full py-2 px-3 border border-[#E4E0D6] rounded-lg font-mono text-xs focus:border-[#0F8B8D] outline-none text-rose-600 font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#14213D] block mb-1">Target Work Center</label>
              <input
                type="text"
                value={quickModifyBom.routings?.[0]?.workCenter || 'WC-INJ-01'}
                onChange={(e) => {
                  const updatedRoutings = [...(quickModifyBom.routings || [])];
                  if (updatedRoutings.length > 0) {
                    updatedRoutings[0] = { ...updatedRoutings[0], workCenter: e.target.value };
                  }
                  setQuickModifyBom({ ...quickModifyBom, routings: updatedRoutings });
                }}
                className="w-full py-2 px-3 border border-[#E4E0D6] rounded-lg text-xs focus:border-[#0F8B8D] outline-none"
                placeholder="e.g. WC-INJ-01"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#14213D] block mb-1">Assigned Mold Tool</label>
              <input
                type="text"
                value={quickModifyBom.machineMoldReqs?.moldToolId || 'MOLD-001'}
                onChange={(e) => {
                  setQuickModifyBom({
                    ...quickModifyBom,
                    machineMoldReqs: {
                      ...(quickModifyBom.machineMoldReqs || { cavities: 1, standardCycleTimeSec: 45, setupTimeMin: 45 }),
                      moldToolId: e.target.value,
                    },
                  });
                }}
                className="w-full py-2 px-3 border border-[#E4E0D6] rounded-lg text-xs focus:border-[#0F8B8D] outline-none font-mono"
                placeholder="e.g. MOLD-INJ-084"
              />
            </div>
          </div>

          {/* Recipe Components Quick Overview Table with Unique Formula Code and Core Material Summation */}
          {(() => {
            const recipeCode = quickModifyBom.recipeCode || quickModifyBom.formulaCode || masterDataGovernanceService.generateFormulaRecipeId(
              quickModifyBom.parent || quickModifyBom.id,
              quickModifyBom.parentName,
              quickModifyBom.version
            );
            const cleanVersion = (quickModifyBom.version || '1.0').trim().replace(/^[vV]+/, '');
            
            const isAuxiliaryLine = (line: BomLine) => {
              const code = (line.item || '').toUpperCase();
              const cat = (line.category || '').toUpperCase();
              const uom = (line.uom || '').toUpperCase();
              return (
                code.startsWith('BOP-') ||
                code.startsWith('CON-') ||
                code.startsWith('PK-') ||
                code.startsWith('PCK-') ||
                cat.includes('PACK') ||
                cat.includes('BOUGHT') ||
                cat.includes('CONSUMABLE') ||
                cat.includes('HARDWARE') ||
                uom === 'PCS' ||
                uom === 'SET' ||
                uom === 'BOX' ||
                uom === 'ROLL'
              );
            };

            const getLineRoleBadge = (line: BomLine) => {
              const code = (line.item || '').toUpperCase();
              const cat = (line.category || '').toUpperCase();
              if (code.startsWith('PK-') || code.startsWith('PCK-') || cat.includes('PACK')) {
                return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">PCK &middot; Packaging</span>;
              }
              if (code.startsWith('BOP-') || cat.includes('BOUGHT') || cat.includes('HARDWARE')) {
                return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">BOP &middot; Bought Out</span>;
              }
              if (code.startsWith('CON-') || cat.includes('CONSUMABLE')) {
                return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">CON &middot; Consumable</span>;
              }
              if (code.startsWith('MB-')) {
                return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">MB &middot; Masterbatch</span>;
              }
              if (code.startsWith('AD-')) {
                return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">AD &middot; Additive</span>;
              }
              if (code.startsWith('RG-')) {
                return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">RG &middot; Regrind</span>;
              }
              return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">RM &middot; Core Resin</span>;
            };

            const coreMaterialLines = (quickModifyBom.lines || []).filter((l) => !isAuxiliaryLine(l));
            const auxiliaryLines = (quickModifyBom.lines || []).filter((l) => isAuxiliaryLine(l));

            const totalMaterialUnitQty = coreMaterialLines.reduce((sum, l) => sum + (Number(l.qty) || 0), 0);
            const totalMaterialBatchQty = totalMaterialUnitQty * (quickModifyBom.batchSize || 1000);
            const materialUom = coreMaterialLines[0]?.uom || 'KG';

            return (
              <div className="space-y-3 pt-1">
                {/* Top Formula Formulation Header Card */}
                <div className="p-3.5 bg-gradient-to-r from-blue-50/80 via-emerald-50/60 to-teal-50/70 border border-blue-200 rounded-xl space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-100 pb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-blue-300 rounded-lg text-xs font-mono font-bold text-blue-900 shadow-2xs">
                        <Fingerprint className="w-3.5 h-3.5 text-blue-600" />
                        <span>RECIPE / FORMULA ID: {recipeCode}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100/70 text-blue-800 border border-blue-200">
                        Linked to BOM {quickModifyBom.id} (v{cleanVersion})
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 font-medium">
                      Batch Size: <strong className="text-[#14213D] font-mono">{quickModifyBom.batchSize} {quickModifyBom.baseUOM || 'PCS'}</strong>
                    </div>
                  </div>

                  {/* Summary Metrics: Material Sum (excluding BOP, CON, PCK) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="p-2 bg-white/90 rounded-lg border border-blue-100 shadow-2xs">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                        Core Material Sum Unit Qty
                      </span>
                      <span className="font-mono text-sm font-bold text-blue-900">
                        {totalMaterialUnitQty.toFixed(4)} {materialUom} <span className="text-[10px] text-gray-400 font-normal">/ PC</span>
                      </span>
                    </div>
                    <div className="p-2 bg-white/90 rounded-lg border border-emerald-100 shadow-2xs">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                        Core Material Sum Batch Qty
                      </span>
                      <span className="font-mono text-sm font-bold text-emerald-800">
                        {totalMaterialBatchQty.toFixed(2)} {materialUom} <span className="text-[10px] text-gray-400 font-normal">/ Batch</span>
                      </span>
                    </div>
                    <div className="p-2 bg-white/90 rounded-lg border border-teal-100 shadow-2xs">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                        Core Formulation Blend
                      </span>
                      <span className="font-mono text-sm font-bold text-teal-800">
                        {coreMaterialLines.length} Material{coreMaterialLines.length !== 1 ? 's' : ''} (100%)
                      </span>
                    </div>
                    <div className="p-2 bg-white/90 rounded-lg border border-amber-100 shadow-2xs">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                        Excluded Auxiliaries
                      </span>
                      <span className="font-mono text-sm font-bold text-amber-800">
                        {auxiliaryLines.length} Items (BOP/CON/PCK)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Table Header Bar */}
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-xs font-bold text-[#14213D] uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#0F8B8D]" /> Formula &amp; Part Components ({quickModifyBom.lines?.length || 0})
                  </h4>
                  <span className="text-[11px] text-gray-500">
                    {coreMaterialLines.length} Core Materials &bull; {auxiliaryLines.length} Packaging/BOP
                  </span>
                </div>

                <div className="overflow-x-auto border border-[#E4E0D6] rounded-xl [scrollbar-width:none]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#F6F4EF] text-[#14213D] border-b border-[#E4E0D6] font-semibold text-[11px]">
                        <th className="py-2 px-3">Item Code</th>
                        <th className="py-2 px-3">Component Name</th>
                        <th className="py-2 px-3">Role / Classification</th>
                        <th className="py-2 px-3 text-right">Unit Qty</th>
                        <th className="py-2 px-3 text-center">UOM</th>
                        <th className="py-2 px-3 text-right">Batch Qty</th>
                        <th className="py-2 px-3 text-right">Formula %</th>
                        <th className="py-2 px-3 text-right">Scrap %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(quickModifyBom.lines || []).map((line, idx) => {
                        const isAux = isAuxiliaryLine(line);
                        const formulaPct = !isAux && totalMaterialUnitQty > 0
                          ? ((Number(line.qty) / totalMaterialUnitQty) * 100).toFixed(1)
                          : null;

                        return (
                          <tr key={line.id || idx} className={`hover:bg-gray-50 ${isAux ? 'bg-amber-50/20' : ''}`}>
                            <td className="py-2 px-3 font-mono font-bold text-[#0F8B8D]">{line.item}</td>
                            <td className="py-2 px-3 font-medium text-[#14213D]">{line.name}</td>
                            <td className="py-2 px-3">{getLineRoleBadge(line)}</td>
                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                step="0.0001"
                                value={line.qty}
                                onChange={(e) => {
                                  const newQty = parseFloat(e.target.value) || 0;
                                  const updatedLines = [...quickModifyBom.lines];
                                  updatedLines[idx] = { ...updatedLines[idx], qty: newQty };
                                  setQuickModifyBom({ ...quickModifyBom, lines: updatedLines });
                                }}
                                className="w-20 text-right py-0.5 px-1.5 border border-[#E4E0D6] rounded font-mono text-xs focus:border-[#0F8B8D]"
                              />
                            </td>
                            <td className="py-2 px-3 text-center font-mono text-gray-600">{line.uom}</td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-gray-700">
                              {(line.qty * (quickModifyBom.batchSize || 1000)).toFixed(2)} {line.uom}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold">
                              {formulaPct ? (
                                <span className="text-blue-700">{formulaPct}%</span>
                              ) : (
                                <span className="text-gray-400 text-[10px]">N/A (BOP)</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                step="0.1"
                                value={line.scrapPct ?? 1.5}
                                onChange={(e) => {
                                  const newScrap = parseFloat(e.target.value) || 0;
                                  const updatedLines = [...quickModifyBom.lines];
                                  updatedLines[idx] = { ...updatedLines[idx], scrapPct: newScrap };
                                  setQuickModifyBom({ ...quickModifyBom, lines: updatedLines });
                                }}
                                className="w-16 text-right py-0.5 px-1.5 border border-[#E4E0D6] rounded font-mono text-xs focus:border-[#0F8B8D] text-rose-600"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-[#F9F8F5] border-t-2 border-[#E4E0D6] font-semibold text-xs text-[#14213D]">
                      <tr className="bg-blue-50/50">
                        <td colSpan={3} className="py-2 px-3 text-blue-900 font-bold">
                          Core Material Formula Sum (Excl. BOP / CON / PCK):
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-blue-900">
                          {totalMaterialUnitQty.toFixed(4)}
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-blue-900">{materialUom}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800">
                          {totalMaterialBatchQty.toFixed(2)} {materialUom}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-blue-900">100.0%</td>
                        <td className="py-2 px-3 text-right text-[11px] text-gray-500">Net Resin</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* Engineering Notes & Remarks */}
          <div>
            <label className="text-xs font-bold text-[#14213D] block mb-1">Engineering Notes / Revision Remarks</label>
            <textarea
              rows={2}
              value={quickModifyBom.notes || ''}
              onChange={(e) => setQuickModifyBom({ ...quickModifyBom, notes: e.target.value })}
              placeholder="Enter revision notes, engineering change justification, or production instructions..."
              className="w-full py-2 px-3 border border-[#E4E0D6] rounded-lg text-xs focus:border-[#0F8B8D] outline-none resize-none"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#E4E0D6] bg-[#F9F8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const pItem = items.find((i) => i.code === quickModifyBom.parent) || (items.length > 0 ? items[0] : null);
                if (pItem) {
                  onClose();
                  onOpenWizard(pItem);
                } else {
                  showToast('Catalog record not found for parent item.');
                }
              }}
              className="btn btn-sm btn-ghost border-[#E4E0D6] text-xs flex items-center gap-1.5 hover:bg-teal-50"
            >
              <Layers className="w-3.5 h-3.5 text-[#0F8B8D]" /> Open in 9-Step Wizard
            </button>
            <button
              type="button"
              onClick={() => {
                const bId = quickModifyBom.id;
                onClose();
                onNavigate('bomTree', { id: bId });
              }}
              className="btn btn-sm btn-ghost border-[#E4E0D6] text-xs flex items-center gap-1.5 hover:bg-gray-100"
            >
              <FolderTree className="w-3.5 h-3.5" /> View BOM Tree
            </button>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-sm btn-ghost border-[#E4E0D6] text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (!masterDataGovernanceService.canUserPerformAction('edit_bom')) {
                  showToast('Admin permission required to save BOM changes.');
                  return;
                }
                onSave(quickModifyBom);
                showToast(`✓ BOM ${quickModifyBom.id} (${quickModifyBom.parentName}) updated successfully!`);
                onClose();
              }}
              className="btn btn-sm btn-primary text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-3.5 h-3.5" /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
