import React from 'react';
import {
  X,
  Printer,
  Barcode,
  Layers,
  Cpu,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  User,
  ShieldCheck,
  Boxes,
} from 'lucide-react';
import { PlannedMachineJob, StoreInventoryNode } from './jitTypes';
import { ItemMaster, BomMaster, MachineMaster } from '../../../types';
import { MoldMaster } from '../../../data/manufacturingData';
import {
  categorizeBomLine,
  parseStockNumber,
  getSyntheticRecipeForPart,
  DEFAULT_CONNECTED_STORES,
  getFormulaRecipeId,
} from './jitCalculations';
import { Fingerprint } from 'lucide-react';

interface Props {
  job: PlannedMachineJob;
  scheduleNumber: string;
  items: ItemMaster[];
  boms: BomMaster[];
  machines: MachineMaster[];
  molds: MoldMaster[];
  stores?: StoreInventoryNode[];
  onClose: () => void;
}

export const JitTravelerModal: React.FC<Props> = ({
  job,
  scheduleNumber,
  items,
  boms,
  machines,
  molds,
  stores = DEFAULT_CONNECTED_STORES,
  onClose,
}) => {
  const itemMap = new Map<string, ItemMaster>(items.map((i) => [i.code, i]));
  const item = itemMap.get(job.itemCode);
  const machine = machines.find((m) => m.id === job.machineId);
  const mold = molds.find((m) => m.id === job.moldId);
  const bom = job.bomId ? boms.find((b) => b.id === job.bomId) : boms.find((b) => b.parent === job.itemCode);
  const lines = (bom && bom.lines && bom.lines.length > 0) ? bom.lines : (item ? getSyntheticRecipeForPart(item) : []);

  // Task 3: Formula ID for Traveler
  const formulaId = job.formulaId || getFormulaRecipeId(
    job.itemCode,
    item?.name || job.itemName,
    bom?.version || '2.1',
    bom?.formulaCode || bom?.recipeCode
  );

  const woNumber = job.workOrderId || `WO-JIT-${job.planDate.replace(/-/g, '').slice(2)}-${job.machineId}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200 print:p-0 print:static print:bg-white print:backdrop-blur-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden print:max-h-none print:shadow-none print:border-none print:w-full">
        {/* Modal Action Header (hidden in print) */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Barcode className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">Work Order Production Traveler & Router</h3>
              <p className="text-xs text-slate-500 font-mono">Reference: {woNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Traveler</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Traveler Sheet Canvas */}
        <div className="p-6 overflow-y-auto flex-1 bg-white print:p-2 text-slate-800 text-xs">
          {/* Top Organization Header */}
          <div className="border-b-2 border-black pb-3 mb-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                SP-PLASTECH INDUSTRIAL AUTOMATION &bull; SHOPFLOOR ROUTER
              </span>
              <h2 className="text-xl font-black text-slate-900">
                WORK ORDER TRAVELER SHEET
              </h2>
            </div>
            <div className="text-right">
              <div className="font-mono font-black text-base text-indigo-900">{woNumber}</div>
              <div className="text-[11px] text-slate-500">Schedule: {scheduleNumber}</div>
              <div className="inline-flex items-center gap-1 font-mono font-bold text-[10.5px] bg-cyan-50 text-cyan-800 border border-cyan-300 px-2 py-0.5 rounded mt-1">
                <Fingerprint className="w-3 h-3 text-cyan-600" />
                {formulaId}
              </div>
            </div>
          </div>

          {/* Barcode & Key Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 mb-4 print:bg-transparent print:border-black">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">TARGET ITEM</span>
              <strong className="font-mono text-sm text-slate-900 block">{job.itemCode}</strong>
              <span className="text-[11px] text-slate-600 truncate block">{job.itemName}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">TARGET OUTPUT</span>
              <strong className="font-mono text-base text-indigo-700 block">
                {job.calculatedPcs.toLocaleString()} PCS
              </strong>
              <span className="text-[11px] text-slate-500">Planned Hours: {job.plannedHours}h</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">MACHINE & PLANT</span>
              <strong className="font-bold text-slate-900 block">{job.machineId}</strong>
              <span className="text-[11px] text-slate-500">{job.plant || 'PLANT-01'} ({machine?.tonnage || '250T'})</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">TOOLING / MOLD</span>
              <strong className="font-bold text-slate-900 block truncate">{job.moldName}</strong>
              <span className="text-[11px] text-slate-500">{job.cavities} Cav &bull; {job.cycleTimeSec}s Cycle</span>
            </div>
          </div>

          {/* Meta Details 2-Column Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border border-slate-200 rounded-lg p-3 mb-4 text-[11px] print:border-black">
            <div>
              <span className="text-slate-500 block">Production Date:</span>
              <strong className="font-semibold text-slate-800">{job.planDate}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Expected Finish:</span>
              <strong className="font-semibold text-indigo-800">{job.expectedFinishDate || job.planDate}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Assigned Operator:</span>
              <strong className="font-semibold text-slate-800">{job.operator || 'Floor Lead'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Order Priority:</span>
              <span className="font-bold text-indigo-700">{job.priority}</span>
            </div>
          </div>

          {/* BOM Recipe Materials Required */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-indigo-600" />
                Raw Materials &amp; Recipe Components
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-500">
                  Linked BOM: <strong>{bom ? `${bom.id} (${bom.version || 'v2.1'})` : 'Standard Recipe'}</strong>
                </span>
                <span className="text-[10px] font-mono font-bold bg-cyan-50 text-cyan-800 border border-cyan-300 px-1.5 py-0.5 rounded">
                  Formula: {formulaId}
                </span>
              </div>
            </div>

            <table className="w-full text-left text-xs border border-slate-300 print:border-black">
              <thead className="bg-slate-100 text-slate-700 font-bold text-[10px] uppercase border-b border-slate-300 print:border-black print:bg-slate-200">
                <tr>
                  <th className="py-1.5 px-2.5 border-r border-slate-300 print:border-black">Category</th>
                  <th className="py-1.5 px-2.5 border-r border-slate-300 print:border-black">Material Code & Name</th>
                  <th className="py-1.5 px-2.5 text-right border-r border-slate-300 print:border-black">Dosage / Pc</th>
                  <th className="py-1.5 px-2.5 text-right border-r border-slate-300 print:border-black">Total Required</th>
                  <th className="py-1.5 px-2.5 border-r border-slate-300 print:border-black">Assigned Store</th>
                  <th className="py-1.5 px-2.5 text-center">Batch / Lot Issued</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 print:divide-black">
                {lines.map((l, i) => {
                  const matItem = itemMap.get(l.item);
                  const cat = categorizeBomLine(l, matItem, job.plant);
                  const scrapFactor = 1 + (l.scrap || 0) / 100;
                  const reqQty = (l.qty || 0) * scrapFactor * job.calculatedPcs;

                  return (
                    <tr key={i}>
                      <td className="py-1.5 px-2.5 font-bold text-[10px] border-r border-slate-300 print:border-black">
                        {cat.label.split(' ')[0]}
                      </td>
                      <td className="py-1.5 px-2.5 border-r border-slate-300 print:border-black">
                        <span className="font-mono font-bold text-slate-900">{l.item}</span>
                        <div className="text-[10px] text-slate-500">{l.name || matItem?.name}</div>
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-mono border-r border-slate-300 print:border-black">
                        {l.qty} {l.uom}
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-mono font-bold text-indigo-950 border-r border-slate-300 print:border-black">
                        {reqQty.toFixed(3)} {l.uom || 'KG'}
                      </td>
                      <td className="py-1.5 px-2.5 border-r border-slate-300 print:border-black font-mono text-[10px]">
                        {cat.defaultStore}
                      </td>
                      <td className="py-1.5 px-2.5 text-center text-slate-400 font-mono text-[10px]">
                        [ _________________ ]
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Quality Gates & Sign-Off Block */}
          <div className="border-t border-slate-300 pt-3 mt-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-2">
              QUALITY GATES & PRODUCTION SIGN-OFFS
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="border border-slate-300 p-2 rounded text-[10px] h-16 flex flex-col justify-between print:border-black">
                <span className="text-slate-500">1. First Piece Inspection (QC):</span>
                <span className="text-slate-400 font-mono">Sign: ______________ Date: _______</span>
              </div>

              <div className="border border-slate-300 p-2 rounded text-[10px] h-16 flex flex-col justify-between print:border-black">
                <span className="text-slate-500">2. Shift In-Charge / Operator:</span>
                <span className="text-slate-400 font-mono">Sign: ______________ Date: _______</span>
              </div>

              <div className="border border-slate-300 p-2 rounded text-[10px] h-16 flex flex-col justify-between print:border-black">
                <span className="text-slate-500">3. Store Receipt & Acceptance:</span>
                <span className="text-slate-400 font-mono">Sign: ______________ Date: _______</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
