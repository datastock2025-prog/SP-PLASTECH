import React, { useState } from 'react';
import {
  Barcode,
  QrCode,
  Search,
  CheckCircle2,
  AlertTriangle,
  Package,
  Layers,
  ArrowRight,
  ShieldAlert,
  Archive,
  ShoppingBag,
  Sparkles,
  Zap,
} from 'lucide-react';
import { InventoryStockItem } from '../../types/warehouse';
import { WarehouseStatusBadge } from './WarehouseStatusBadge';

interface Props {
  stockItems: InventoryStockItem[];
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const BarcodeScannerSimulatorView: React.FC<Props> = ({
  stockItems,
  onNavigate,
  showToast,
}) => {
  const [scannedCode, setScannedCode] = useState<string>('RM-PP-NAT-001');
  const [matchedItem, setMatchedItem] = useState<InventoryStockItem | null>(
    stockItems.find((i) => i.sku === 'RM-PP-NAT-001') || stockItems[0] || null
  );
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const handleScan = (code: string) => {
    setIsScanning(true);
    setScannedCode(code);
    setTimeout(() => {
      setIsScanning(false);
      const found = stockItems.find(
        (i) =>
          i.sku.toLowerCase() === code.toLowerCase() ||
          i.primaryBin.toLowerCase() === code.toLowerCase() ||
          i.lots.some((l) => l.lotNumber.toLowerCase() === code.toLowerCase())
      );
      setMatchedItem(found || null);
      if (found) {
        showToast(`Barcode Scanned: ${found.sku} (${found.name})`);
      } else {
        showToast(`No item matching barcode: ${code}`);
      }
    }, 400);
  };

  const sampleBarcodes = [
    { label: 'PP Homopolymer Granules', code: 'RM-PP-NAT-001', type: 'SKU' },
    { label: 'HDPE Injection Grade', code: 'RM-HDPE-INJ-002', type: 'SKU' },
    { label: 'Black Masterbatch 40%', code: 'MB-BLK-001', type: 'SKU' },
    { label: 'Bulk Silo #1 Bin Tag', code: 'SILO-01-A', type: 'Bin Tag' },
    { label: 'Polymer Lot #881', code: 'LOT-2026-PP-881', type: 'Lot Batch' },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#14213D] text-white">
          <Barcode className="w-3.5 h-3.5 text-[#0F8B8D]" /> Handheld RF Gun / Terminal Simulator
        </div>
        <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-[#14213D]">
          Industrial Barcode &amp; RFID Scanner
        </h1>
        <p className="text-xs text-slate-500">
          Laser scan simulation for instantaneous dock receiving, bin verification, and inventory lookup
        </p>
      </div>

      {/* Interactive Laser Scanner Card */}
      <div className="bg-[#14213D] text-white p-6 rounded-3xl shadow-2xl border border-[#1C2B4D] space-y-5">
        {/* Laser Visual Window */}
        <div className="relative bg-slate-950/80 rounded-2xl p-8 border border-white/10 flex flex-col items-center justify-center overflow-hidden h-40">
          {/* Animated Red Laser Beam */}
          <div
            className={`absolute left-0 right-0 h-0.5 bg-rose-500 shadow-[0_0_12px_#f43f5e] transition-all duration-500 ${
              isScanning ? 'top-1/2 opacity-100 animate-pulse' : 'top-1/2 opacity-40'
            }`}
          />

          {/* Barcode Graphic */}
          <div className="flex items-center gap-1 opacity-70">
            <div className="w-1 h-16 bg-white" />
            <div className="w-2 h-16 bg-white" />
            <div className="w-0.5 h-16 bg-white" />
            <div className="w-3 h-16 bg-white" />
            <div className="w-1 h-16 bg-white" />
            <div className="w-1.5 h-16 bg-white" />
            <div className="w-0.5 h-16 bg-white" />
            <div className="w-2 h-16 bg-white" />
            <div className="w-1 h-16 bg-white" />
            <div className="w-3 h-16 bg-white" />
            <div className="w-0.5 h-16 bg-white" />
            <div className="w-2 h-16 bg-white" />
          </div>

          <div className="font-mono text-xs text-slate-300 mt-2 font-bold tracking-wider">
            {scannedCode || 'READY TO SCAN'}
          </div>
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Barcode className="w-5 h-5 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={scannedCode}
              onChange={(e) => setScannedCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScan(scannedCode)}
              placeholder="Scan or enter Barcode / QR / Lot #..."
              className="w-full pl-11 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder:text-slate-400 font-mono focus:ring-2 focus:ring-[#0F8B8D] outline-none"
            />
          </div>
          <button
            onClick={() => handleScan(scannedCode)}
            className="px-5 py-2.5 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
          >
            <Zap className="w-4 h-4" /> Trigger Laser
          </button>
        </div>

        {/* Quick Sample Chips */}
        <div className="space-y-1.5">
          <div className="text-[11px] text-slate-400 font-medium">Quick Test Barcodes:</div>
          <div className="flex flex-wrap gap-2">
            {sampleBarcodes.map((item) => (
              <button
                key={item.code}
                onClick={() => handleScan(item.code)}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-[11px] text-slate-200 font-mono transition flex items-center gap-1.5"
              >
                <span>{item.code}</span>
                <span className="text-[9px] px-1 bg-[#0F8B8D]/40 rounded text-teal-200">{item.type}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scanned Result Resolver Card */}
      {matchedItem ? (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-[#0F8B8D]">{matchedItem.sku}</span>
              <WarehouseStatusBadge status={matchedItem.status} size="xs" />
            </div>
            <span className="text-xs text-slate-500 font-mono">Location: <span className="font-bold text-[#14213D]">{matchedItem.primaryBin}</span></span>
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-base font-['Space_Grotesk'] text-[#14213D]">{matchedItem.name}</h3>
            {matchedItem.resinGrade && (
              <div className="text-xs text-slate-600 font-mono">{matchedItem.resinGrade}</div>
            )}
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-slate-500">On Hand Total</div>
              <div className="text-base font-bold font-mono text-[#14213D]">{matchedItem.totalOnHand.toLocaleString()} {matchedItem.uom}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-slate-500">Available Stock</div>
              <div className="text-base font-bold font-mono text-emerald-600">{matchedItem.availableToPromise.toLocaleString()} {matchedItem.uom}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-slate-500">Storage Warehouse</div>
              <div className="text-xs font-bold text-slate-800">{matchedItem.primaryWarehouse.split('(')[0]}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-slate-500">Unit Valuation</div>
              <div className="text-base font-bold font-mono text-slate-800">₹{matchedItem.unitCostInr} / {matchedItem.uom}</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => onNavigate('stockList')}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              Open Stock Ledger
            </button>
            <button
              onClick={() => onNavigate('putaway')}
              className="px-3.5 py-2 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              Initiate Putaway
            </button>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm text-xs text-slate-500 space-y-2">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
          <div className="font-bold text-slate-800 text-sm">No Matching Inventory Record</div>
          <p>Scan a valid polymer SKU code, Silo Bin Tag, or Batch Lot barcode to view real-time data.</p>
        </div>
      )}
    </div>
  );
};
