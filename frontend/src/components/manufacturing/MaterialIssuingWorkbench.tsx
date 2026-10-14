import React, { useState } from 'react';
import { WorkOrder, ItemMaster, StockTransaction } from '../../types';
import {
  Barcode,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Package,
  Layers,
  Sparkles,
  RefreshCw,
  Zap,
  Tag,
  ShieldCheck
} from 'lucide-react';

interface MaterialIssuingProps {
  workOrders: WorkOrder[];
  items: ItemMaster[];
  stockTxns: StockTransaction[];
  selectedWoId?: string;
  onNavigate: (view: string, param?: any) => void;
  onIssueMaterial: (woId: string, itemCode: string, qty: number) => void;
  showToast: (msg: string) => void;
}

export const MaterialIssuingWorkbench: React.FC<MaterialIssuingProps> = ({
  workOrders,
  items,
  stockTxns,
  selectedWoId,
  onNavigate,
  onIssueMaterial,
  showToast,
}) => {
  const [selectedWO, setSelectedWO] = useState<string>(selectedWoId || 'WO-1188');
  const [scannedBarcode, setScannedBarcode] = useState<string>('');
  const [scanValidationState, setScanValidationState] = useState<{
    status: 'idle' | 'success' | 'warning' | 'error';
    message: string;
    lotInfo?: string;
  }>({ status: 'idle', message: '' });

  const currentWO = workOrders.find((w) => w.id === selectedWO) || workOrders[0];
  const itemName = (code: string) => items.find((i) => i.code === code)?.name || code;

  // Mock materials required for current WO
  const requiredMaterials = [
    { code: 'RM-PP-NAT-001', name: 'PP Natural Granules', reqKg: 500, issuedKg: 500, uom: 'KG', lotSuggested: 'LOT-001-01', bin: 'RM-WH-01-A1', status: 'Issued' },
    { code: 'MB-WHT-002', name: 'White Masterbatch (2%)', reqKg: 10, issuedKg: 10, uom: 'KG', lotSuggested: 'LOT-MB-00456', bin: 'RM-WH-02-B2', status: 'Issued' },
    { code: 'AD-UV-009', name: 'UV Stabilizer Additive', reqKg: 2, issuedKg: 0, uom: 'KG', lotSuggested: 'LOT-UV-00078', bin: 'RM-WH-02-C1', status: 'Pending Issue' },
    { code: 'RG-PP-011', name: 'Regrind PP (Max 20% limit)', reqKg: 100, issuedKg: 100, uom: 'KG', lotSuggested: 'RG-00321', bin: 'REGRIND-BAY-01', status: 'Issued' },
    { code: 'PK-CTN-021', name: 'Packaging Cartons', reqKg: 200, issuedKg: 0, uom: 'PCS', lotSuggested: 'PK-LOT-88', bin: 'PK-WH-01-A1', status: 'Pending Issue' }
  ];

  const handleSimulateScan = (barcode: string) => {
    setScannedBarcode(barcode);
    if (barcode === 'LOT-UV-00078' || barcode === 'AD-UV-009') {
      setScanValidationState({
        status: 'success',
        message: 'Valid Barcode Matched! Item: UV Stabilizer Additive (Lot: LOT-UV-00078). FEFO verified (Expires 2027-08).',
        lotInfo: 'Stock Deducted: 2 KG from RM-WH-02-C1'
      });
      showToast('Barcode scanned & verified: 2 KG UV Additive Issued');
    } else if (barcode.includes('EXP')) {
      setScanValidationState({
        status: 'error',
        message: 'Scan Blocked! Lot is Expired / Quarantined by QA. Cannot issue to production.',
      });
    } else if (barcode === 'LOT-001-02') {
      setScanValidationState({
        status: 'warning',
        message: 'Suboptimal Lot Warning: LOT-001-01 expires earlier. FEFO policy suggests issuing LOT-001-01 first.',
      });
    } else {
      setScanValidationState({
        status: 'success',
        message: `Barcode ${barcode} verified against BOM line. Material issue ready for confirmation.`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E4E0D6] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#0F8B8D]/10 text-[#0F8B8D]">
              Warehouse &rarr; Production Handoff
            </span>
            <span className="text-[11px] text-[#6B7280]">
              Barcode FEFO Validation &bull; Auto-Backflush Support
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#14213D]">Material Requirement &amp; Issuing</h1>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#6B7280] font-semibold">Select Work Order:</span>
          <select
            value={selectedWO}
            onChange={(e) => setSelectedWO(e.target.value)}
            className="p-2 rounded-xl border border-[#E4E0D6] bg-white font-bold text-[#14213D]"
          >
            {workOrders.map((w) => (
              <option key={w.id} value={w.id}>{w.id} &mdash; {itemName(w.item)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Issue Workbench */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Required Materials Table */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-[#E4E0D6] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D6]">
            <div>
              <h3 className="font-bold text-sm text-[#14213D]">BOM Explosion &amp; Issue Checklist</h3>
              <div className="text-[11px] text-[#6B7280]">
                Work Order: <b>{currentWO?.id}</b> &bull; Product: <b>{itemName(currentWO?.item || '')}</b> &bull; Machine: <b>{currentWO?.machine}</b>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#0F8B8D]/10 text-[#0F8B8D]">
              Auto-Backflush Ready
            </span>
          </div>

          <div className="space-y-3">
            {requiredMaterials.map((m, idx) => {
              const isIssued = m.status === 'Issued';
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border transition-all ${
                    isIssued ? 'bg-emerald-50/50 border-emerald-200' : 'bg-[#F6F4EF] border-[#E4E0D6]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[#0F8B8D]">{m.code}</span>
                        <span className="font-semibold text-xs text-[#14213D]">{m.name}</span>
                      </div>
                      <div className="text-[11px] text-[#6B7280]">
                        Suggested Lot: <b className="font-mono text-[#14213D]">{m.lotSuggested}</b> &bull; Warehouse Bin: <b className="font-mono text-[#14213D]">{m.bin}</b>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-mono font-bold text-sm text-[#14213D]">
                          {m.reqKg} {m.uom}
                        </div>
                        <span className={`text-[10px] font-bold ${isIssued ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {m.status}
                        </span>
                      </div>

                      {!isIssued ? (
                        <button
                          onClick={() => handleSimulateScan(m.lotSuggested)}
                          className="px-3 py-1.5 rounded-lg bg-[#0F8B8D] hover:bg-[#0c7072] text-white font-bold text-xs shadow-xs"
                        >
                          [SCAN] &amp; ISSUE
                        </button>
                      ) : (
                        <span className="p-1.5 rounded-full bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Barcode Scanner & Validation Console */}
        <div className="bg-white rounded-2xl border border-[#E4E0D6] p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-[#14213D]">Wireless Barcode Scanner Console</h3>
          <div className="p-4 rounded-xl bg-[#F6F4EF] border border-[#E4E0D6] space-y-3">
            <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">
              Scan Material / Pallet QR Code
            </label>
            <div className="relative">
              <Barcode className="w-5 h-5 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Scan or type barcode (e.g. LOT-UV-00078)..."
                value={scannedBarcode}
                onChange={(e) => handleSimulateScan(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#E4E0D6] bg-white font-mono text-xs font-bold text-[#14213D]"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] text-[#6B7280] w-full">Quick Test Barcodes:</span>
              <button
                onClick={() => handleSimulateScan('LOT-UV-00078')}
                className="px-2 py-1 rounded bg-white hover:bg-slate-50 border border-[#E4E0D6] text-[10px] font-mono font-bold"
              >
                LOT-UV-00078 (Valid)
              </button>
              <button
                onClick={() => handleSimulateScan('LOT-001-02')}
                className="px-2 py-1 rounded bg-white hover:bg-slate-50 border border-[#E4E0D6] text-[10px] font-mono font-bold text-amber-700"
              >
                LOT-001-02 (FEFO Warn)
              </button>
              <button
                onClick={() => handleSimulateScan('EXP-LOT-999')}
                className="px-2 py-1 rounded bg-white hover:bg-slate-50 border border-[#E4E0D6] text-[10px] font-mono font-bold text-rose-700"
              >
                EXP-LOT-999 (Blocked)
              </button>
            </div>
          </div>

          {/* Validation Feedback Box */}
          {scanValidationState.status !== 'idle' && (
            <div
              className={`p-4 rounded-xl border text-xs space-y-1 ${
                scanValidationState.status === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : scanValidationState.status === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                {scanValidationState.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                {scanValidationState.status === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                {scanValidationState.status === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600" />}
                <span>Validation Result</span>
              </div>
              <p>{scanValidationState.message}</p>
              {scanValidationState.lotInfo && (
                <p className="font-mono text-[11px] font-semibold opacity-90">{scanValidationState.lotInfo}</p>
              )}
            </div>
          )}

          {/* Return To Stock Action */}
          <div className="pt-3 border-t border-[#E4E0D6] space-y-2">
            <h4 className="font-bold text-xs text-[#14213D]">Partial Bag Return to Warehouse</h4>
            <p className="text-[11px] text-[#6B7280]">
              Returned unused virgin resin or partial bags are weighed, re-labeled with barcode, and moved to sealed storage.
            </p>
            <button
              onClick={() => showToast('Partial bag return workflow triggered with reprint label')}
              className="w-full py-2 rounded-xl bg-[#F6F4EF] hover:bg-[#FAF9F5] border border-[#E4E0D6] text-xs font-semibold text-[#14213D]"
            >
              Return Unused Material &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
