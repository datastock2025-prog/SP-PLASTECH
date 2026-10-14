import React, { useState } from 'react';
import {
  X,
  Smartphone,
  QrCode,
  Barcode,
  Camera,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Minus,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { ConfirmedPoQueueItem } from '../../../types/grnTypes';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  poQueue: ConfirmedPoQueueItem[];
  onCompleteScan: (poNumber: string, scannedQty: number, lotNumber: string) => void;
  showToast: (msg: string) => void;
}

export const MobileBarcodeReceivingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  poQueue,
  onCompleteScan,
  showToast,
}) => {
  if (!isOpen) return null;

  const [selectedPo, setSelectedPo] = useState<ConfirmedPoQueueItem>(poQueue[0]);
  const [scannedBarcode, setScannedBarcode] = useState('PO-3391-RM-PP-NAT-001');
  const [lotNumber, setLotNumber] = useState('LOT-2026-MOB-9901');
  const [quantity, setQuantity] = useState<number>(selectedPo?.openPoQty || 1000);
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);

  const simulateScan = () => {
    setIsScanning(true);
    setScanSuccess(false);
    setTimeout(() => {
      setIsScanning(false);
      setScanSuccess(true);
      showToast('Barcode scanned successfully: GS1-128 matched!');
    }, 700);
  };

  const handlePost = () => {
    onCompleteScan(selectedPo.poNumber, quantity, lotNumber);
    showToast(`Mobile dock receiving logged: ${quantity} ${selectedPo.uom} under ${lotNumber}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-slate-900 text-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col border border-slate-800 animate-in fade-in zoom-in-95">
        {/* Mobile Device Top Status Bar */}
        <div className="px-5 py-3 bg-slate-950 flex items-center justify-between border-b border-slate-800 text-[11px] text-slate-400">
          <div className="flex items-center gap-1 font-mono">
            <Smartphone className="w-3.5 h-3.5 text-teal-400" />
            <span>Zebra TC52 Terminal #04</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewport Screen */}
        <div className="p-4 space-y-4 text-xs overflow-y-auto max-h-[80vh]">
          {/* Active PO Selector */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">Active Dock Inward PO</label>
            <select
              value={selectedPo?.poNumber}
              onChange={(e) => {
                const found = poQueue.find((p) => p.poNumber === e.target.value);
                if (found) {
                  setSelectedPo(found);
                  setQuantity(found.openPoQty);
                }
              }}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono font-bold"
            >
              {poQueue.map((p) => (
                <option key={p.id} value={p.poNumber}>
                  {p.poNumber} — {p.itemName} ({p.openPoQty} {p.uom})
                </option>
              ))}
            </select>
          </div>

          {/* Scanner Viewport Simulation */}
          <div className="relative rounded-2xl bg-black border-2 border-slate-700 p-4 h-36 flex flex-col items-center justify-center overflow-hidden">
            {isScanning ? (
              <div className="space-y-2 text-center">
                <div className="w-full h-0.5 bg-red-500 animate-pulse shadow-lg shadow-red-500" />
                <span className="text-[11px] text-teal-300 font-mono">Scanning 2D DataMatrix...</span>
              </div>
            ) : scanSuccess ? (
              <div className="space-y-1 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto animate-bounce" />
                <span className="text-emerald-400 font-bold text-xs">Match Verified: 25KG Bags</span>
                <div className="text-[10px] font-mono text-slate-400">{scannedBarcode}</div>
              </div>
            ) : (
              <div className="space-y-2 text-center">
                <Barcode className="w-10 h-10 text-slate-500 mx-auto" />
                <button
                  type="button"
                  onClick={simulateScan}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 mx-auto"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  Trigger Laser Scan
                </button>
              </div>
            )}
          </div>

          {/* Quantity Stepper & Keypad */}
          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700 space-y-2">
            <div className="flex justify-between items-center text-[11px] text-slate-300">
              <span>Unloaded Count ({selectedPo?.uom})</span>
              <span className="text-teal-300 font-mono">Open: {selectedPo?.openPoQty}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(25, q - 25))}
                className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-bold"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full py-2 bg-slate-900 border border-slate-700 rounded-xl text-center text-lg font-mono font-extrabold text-white"
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 25)}
                className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-bold"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Lot & Bin Inputs */}
          <div className="space-y-2">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400">Captured Lot Serial</label>
              <input
                type="text"
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl font-mono text-white"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400">Target Dock / Staging Bin</label>
              <input
                type="text"
                defaultValue="DOCK-02-QUARANTINE"
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl font-mono text-teal-300"
              />
            </div>
          </div>
        </div>

        {/* Mobile Device Bottom Primary Action */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex gap-2">
          <button
            onClick={onClose}
            className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition"
          >
            Cancel
          </button>
          <button
            onClick={handlePost}
            className="w-2/3 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-teal-900/40"
          >
            <CheckCircle2 className="w-4 h-4" />
            Post Scan to GRN
          </button>
        </div>
      </div>
    </div>
  );
};
