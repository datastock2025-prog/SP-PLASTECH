import React, { useState } from 'react';
import {
  Printer,
  Barcode,
  QrCode,
  Tag,
  Package,
  Layers,
  CheckCircle2,
  Download,
  Copy,
  Sparkles,
} from 'lucide-react';
import { InventoryStockItem } from '../../types/warehouse';

interface Props {
  stockItems: InventoryStockItem[];
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const LabelPrintingGeneratorView: React.FC<Props> = ({
  stockItems,
  onNavigate,
  showToast,
}) => {
  const [labelType, setLabelType] = useState<'25kg_bag' | 'pallet_tag' | 'bin_rack'>('25kg_bag');
  const [selectedItemSku, setSelectedItemSku] = useState<string>(stockItems[0]?.sku || 'RM-PP-NAT-001');
  const [batchLot, setBatchLot] = useState<string>('LOT-2026-PP-881');
  const [printCopies, setPrintCopies] = useState<number>(40);

  const activeItem = stockItems.find((i) => i.sku === selectedItemSku) || stockItems[0];

  const handlePrint = () => {
    showToast(`Dispatched ${printCopies} labels to Industrial Zebra Thermal Printer ZT411`);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#14213D] text-white uppercase tracking-wider">
              Zebra Thermal Printer &middot; GS1-128
            </span>
          </div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
            Industrial Barcode &amp; Pallet Label Generator
          </h1>
          <p className="text-xs text-slate-500">
            Generate 25kg bag labels, Euro pallet dispatch placards, and warehouse rack bin barcodes
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-xl text-xs font-bold shadow-md transition"
        >
          <Printer className="w-4 h-4" /> Print {printCopies} Labels
        </button>
      </div>

      {/* Label Configuration Tabs */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          {[
            { id: '25kg_bag', label: '25kg Raw Material Bag Label' },
            { id: 'pallet_tag', label: 'Euro Pallet Dispatch Placard' },
            { id: 'bin_rack', label: 'Warehouse Bin / Rack Tag' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setLabelType(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                labelType === tab.id
                  ? 'bg-[#14213D] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Select Item SKU</label>
            <select
              value={selectedItemSku}
              onChange={(e) => setSelectedItemSku(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#0F8B8D] outline-none"
            >
              {stockItems.map((item) => (
                <option key={item.sku} value={item.sku}>
                  {item.sku} &mdash; {item.name.slice(0, 30)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Batch Lot Number</label>
            <input
              type="text"
              value={batchLot}
              onChange={(e) => setBatchLot(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-[#0F8B8D] outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Number of Copies</label>
            <input
              type="number"
              value={printCopies}
              onChange={(e) => setPrintCopies(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-[#0F8B8D] outline-none"
            />
          </div>
        </div>
      </div>

      {/* Live Label Printable Preview Card */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
          <span>Live Thermal Print Preview (Zebra 4x6" Format)</span>
          <span className="text-[10px] text-slate-400 font-mono">DPI: 300 &bull; Thermal Direct</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-slate-300 shadow-md max-w-lg mx-auto font-mono text-slate-900 space-y-4">
          {/* Label Header */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
            <div>
              <div className="text-base font-black tracking-tight font-['Space_Grotesk']">DATASTOCK POLYMERS</div>
              <div className="text-[10px] text-slate-600">PLANT 01 &bull; HOSUR, INDIA</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded">QC PASSED</div>
            </div>
          </div>

          {/* Item Info */}
          <div className="space-y-1">
            <div className="text-xs text-slate-500 uppercase">Item Description:</div>
            <div className="text-sm font-bold leading-snug">{activeItem.name}</div>
            <div className="text-xs font-bold text-slate-700">SKU: {activeItem.sku}</div>
            {activeItem.resinGrade && (
              <div className="text-[11px] text-slate-600">Grade: {activeItem.resinGrade}</div>
            )}
          </div>

          {/* Grid Spec */}
          <div className="grid grid-cols-2 gap-2 border-y border-slate-300 py-2 text-xs">
            <div>
              <div className="text-[10px] text-slate-500">BATCH LOT NO:</div>
              <div className="font-bold">{batchLot}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">NET WEIGHT:</div>
              <div className="font-bold">{labelType === '25kg_bag' ? '25.0 KG' : '500.0 KG'}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">TARGET BIN:</div>
              <div className="font-bold">{activeItem.primaryBin}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">DATE PACKED:</div>
              <div className="font-bold">2026-08-29</div>
            </div>
          </div>

          {/* High Density Barcode Graphic */}
          <div className="pt-2 text-center space-y-1">
            <div className="flex justify-center items-center gap-0.5 h-12">
              {[2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 1, 2, 4, 2, 1, 3, 1, 2, 1, 4, 2, 1, 3, 2].map((w, i) => (
                <div
                  key={i}
                  className="h-full bg-slate-950"
                  style={{ width: `${w * 2}px` }}
                />
              ))}
            </div>
            <div className="text-[11px] font-bold tracking-widest font-mono">
              *{activeItem.sku}-{batchLot}*
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
