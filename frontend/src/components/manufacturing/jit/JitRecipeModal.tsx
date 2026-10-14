import React from 'react';
import { X, CheckCircle2, AlertTriangle, Layers, Clock, Cpu, Store, ShieldAlert } from 'lucide-react';
import { ItemMaster, BomMaster } from '../../../types';
import { PlannedMachineJob } from './jitTypes';
import { categorizeBomLine, parseStockNumber } from './jitCalculations';

interface Props {
  job: PlannedMachineJob | null;
  items: ItemMaster[];
  boms: BomMaster[];
  onClose: () => void;
}

export const JitRecipeModal: React.FC<Props> = ({ job, items, boms, onClose }) => {
  if (!job) return null;

  const itemMap = new Map<string, ItemMaster>(items.map((i) => [i.code, i]));
  const targetItem = itemMap.get(job.itemCode);
  const bom = boms.find((b) => b.parent === job.itemCode);

  // Extract recipe lines
  const lines = bom?.lines || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                {job.machineId}
              </span>
              <h3 className="text-base font-bold text-slate-900">
                BOM Recipe & Material Explosion
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Production Plan: <strong className="text-slate-800">{job.itemName} ({job.itemCode})</strong> — Target:{' '}
              <strong className="text-indigo-700 font-mono">{job.calculatedPcs.toLocaleString()} PCS</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Machine & Production Parameters Banner */}
        <div className="bg-indigo-50/50 border-b border-indigo-100 px-6 py-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">Machine & Tonnage:</span>
            <strong className="text-slate-800 font-semibold">{job.machineId}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Active Tool / Mold:</span>
            <strong className="text-slate-800 font-semibold">{job.moldName} ({job.cavities} Cav)</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Cycle Time & Velocity:</span>
            <strong className="text-slate-800 font-semibold">{job.cycleTimeSec}s / Shot</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Planned Run Hours:</span>
            <strong className="text-indigo-700 font-bold font-mono">{job.plannedHours} Hours ({job.shift.split(' ')[0]})</strong>
          </div>
        </div>

        {/* Recipe Table */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              Exploded Material Demands & Store Availability
            </h4>
            <span className="text-[11px] text-slate-500">
              Linked BOM: <strong>{bom ? `${bom.id} (${bom.version})` : 'Standard Injection Recipe'}</strong>
            </span>
          </div>

          {lines.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center text-amber-800 text-xs">
              <AlertTriangle className="w-6 h-6 text-amber-600 mx-auto mb-2" />
              No explicitly configured BOM found for {job.itemCode}. The system is using the standard dynamic injection molding recipe (Polymer 97% + Masterbatch 2% + Packaging 1%).
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                    <th className="py-2.5 px-3">Classification</th>
                    <th className="py-2.5 px-3">Component Code & Name</th>
                    <th className="py-2.5 px-3 text-right">Dosage / Pc</th>
                    <th className="py-2.5 px-3 text-right">Scrap %</th>
                    <th className="py-2.5 px-3 text-right font-bold text-slate-900">Total Demand</th>
                    <th className="py-2.5 px-3">Connected Store</th>
                    <th className="py-2.5 px-3 text-right">Store Balance</th>
                    <th className="py-2.5 px-3 text-center">Feasibility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lines.map((line, idx) => {
                    const matItem = itemMap.get(line.item);
                    const catInfo = categorizeBomLine(line, matItem);
                    const scrapFactor = 1 + (line.scrap || 0) / 100;
                    const requiredTotal = Number(((line.qty || 0) * scrapFactor * job.calculatedPcs).toFixed(2));
                    const stockAvail = matItem ? parseStockNumber(matItem.avail || matItem.stock) : 0;
                    const isShortage = stockAvail < requiredTotal;
                    const isTight = !isShortage && stockAvail - requiredTotal < requiredTotal * 0.2;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              catInfo.cat === 'RM'
                                ? 'bg-blue-100 text-blue-800'
                                : catInfo.cat === 'MB'
                                ? 'bg-purple-100 text-purple-800'
                                : catInfo.cat === 'INSERT'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {catInfo.cat}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-mono font-bold text-slate-900">{line.item}</div>
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">{line.name}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          {line.qty} {line.uom}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                          {line.scrap}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-900 bg-indigo-50/40">
                          {requiredTotal.toLocaleString()} {line.uom}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          <div className="flex items-center gap-1 font-medium text-[11px]">
                            <Store className="w-3 h-3 text-slate-400" />
                            {matItem?.wh || catInfo.defaultStore}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium">
                          <span className={isShortage ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                            {stockAvail.toLocaleString()} {line.uom}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {isShortage ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              Short by {(requiredTotal - stockAvail).toFixed(1)} {line.uom}
                            </span>
                          ) : isTight ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              Tight Buffer
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Ready
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Connected to Live Factory Stores: Raw Materials, Masterbatch, Packaging & Hardware Stores
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-xs transition-colors"
          >
            Close Recipe View
          </button>
        </div>
      </div>
    </div>
  );
};
