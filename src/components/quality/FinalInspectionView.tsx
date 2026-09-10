import React, { useState } from 'react';
import { CertificateOfAnalysis, NonConformanceReport, WorkOrder } from '../../types';
import {
  CheckCircle2,
  AlertOctagon,
  Search,
  Filter,
  Plus,
  ShieldCheck,
  Package,
  Layers,
  FileSpreadsheet,
  Printer,
  Check,
  X,
} from 'lucide-react';

interface Props {
  coas: CertificateOfAnalysis[];
  ncrs: NonConformanceReport[];
  workOrders?: WorkOrder[];
  onNavigate: (view: string, param?: any) => void;
  onCreateCOA: (coa: CertificateOfAnalysis) => void;
  onCreateNCR: (ncr: NonConformanceReport) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
}

interface FinalBatch {
  id: string;
  woId: string;
  item: string;
  itemName: string;
  lotNumber: string;
  qty: number;
  uom: string;
  palletCount: number;
  status: 'Ready for QC' | 'Inspecting' | 'Released' | 'Quarantine Hold';
  tests: {
    visual: 'pass' | 'fail' | null;
    dropTest: 'pass' | 'fail' | null;
    sealLeak: 'pass' | 'fail' | null;
    weightSpec: 'pass' | 'fail' | null;
    barcodeScan: 'pass' | 'fail' | null;
  };
  coaId?: string;
  inspector: string;
  date: string;
}

const INITIAL_FINAL_BATCHES: FinalBatch[] = [
  {
    id: 'FQC-2026-112',
    woId: 'WO-1188',
    item: 'FG-CTN-500',
    itemName: 'Plastic Container 500ml',
    lotNumber: 'LOT-CTN-04',
    qty: 6240,
    uom: 'PCS',
    palletCount: 4,
    status: 'Ready for QC',
    tests: {
      visual: null,
      dropTest: null,
      sealLeak: null,
      weightSpec: null,
      barcodeScan: null,
    },
    inspector: '—',
    date: 'Today, 11:45 AM',
  },
  {
    id: 'FQC-2026-111',
    woId: 'WO-1189',
    item: 'FG-PET-030',
    itemName: 'PET Bottle Preform',
    lotNumber: 'LOT-PET-902',
    qty: 2400,
    uom: 'KG',
    palletCount: 6,
    status: 'Released',
    tests: {
      visual: 'pass',
      dropTest: 'pass',
      sealLeak: 'pass',
      weightSpec: 'pass',
      barcodeScan: 'pass',
    },
    coaId: 'COA-2026-0453',
    inspector: 'Priya Rao',
    date: 'Yesterday',
  },
  {
    id: 'FQC-2026-110',
    woId: 'WO-1187',
    item: 'FG-BKT-010',
    itemName: 'Household Bucket 10L',
    lotNumber: 'LOT-BKT-108',
    qty: 1200,
    uom: 'PCS',
    palletCount: 2,
    status: 'Quarantine Hold',
    tests: {
      visual: 'fail',
      dropTest: 'pass',
      sealLeak: 'pass',
      weightSpec: 'pass',
      barcodeScan: 'pass',
    },
    inspector: 'K. Iyer',
    date: '20 Aug 2026',
  },
];

export const FinalInspectionView: React.FC<Props> = ({
  coas,
  ncrs,
  onNavigate,
  onCreateCOA,
  onCreateNCR,
  showToast,
}) => {
  const [batches, setBatches] = useState<FinalBatch[]>(INITIAL_FINAL_BATCHES);
  const [selectedBatchId, setSelectedBatchId] = useState<string>(batches[0].id);
  const [searchTerm, setSearchTerm] = useState('');

  // Active testing state
  const [chkVisual, setChkVisual] = useState<'pass' | 'fail'>('pass');
  const [chkDrop, setChkDrop] = useState<'pass' | 'fail'>('pass');
  const [chkLeak, setChkLeak] = useState<'pass' | 'fail'>('pass');
  const [chkWeight, setChkWeight] = useState<'pass' | 'fail'>('pass');
  const [chkBarcode, setChkBarcode] = useState<'pass' | 'fail'>('pass');

  const currentBatch = batches.find((b) => b.id === selectedBatchId) || batches[0];

  const handleApproveBatch = () => {
    const newCoaId = `COA-2026-${500 + coas.length}`;

    setBatches((prev) =>
      prev.map((b) =>
        b.id === currentBatch.id
          ? {
              ...b,
              status: 'Released',
              tests: {
                visual: chkVisual,
                dropTest: chkDrop,
                sealLeak: chkLeak,
                weightSpec: chkWeight,
                barcodeScan: chkBarcode,
              },
              coaId: newCoaId,
              inspector: 'Priya Rao (Plant QA)',
            }
          : b
      )
    );

    const newCoa: CertificateOfAnalysis = {
      id: newCoaId,
      product: currentBatch.itemName || currentBatch.item,
      itemCode: currentBatch.item,
      lot: currentBatch.lotNumber,
      mfgDate: currentBatch.mfgDate || '2026-08-30',
      expiryDate: '2028-08-30',
      qty: `${currentBatch.batchSize} PCS`,
      source: 'FQC Final Release',
      date: 'Today',
      approvedBy: 'Priya Rao, Quality Assurance Head',
      status: 'Issued',
      tests: [
        { parameter: 'Visual Cosmetic Defect', spec: 'Zero flash / weld lines', result: 'Pass', method: 'Visual Inspection' },
        { parameter: 'Drop Impact Resistance', spec: '1.2m drop without crack', result: 'Pass (3/3)', method: 'ASTM D5276' },
        { parameter: 'Vacuum Seal Leakage', spec: 'No air bubble @ -30 kPa', result: 'Pass', method: 'ASTM D4991' },
        { parameter: 'Part Weight Tolerance', spec: '25.0 ± 0.5 g', result: '25.12 g', method: 'Precision Scale' },
      ],
    };

    onCreateCOA(newCoa);
    showToast(`Batch ${currentBatch.lotNumber} approved! Generated Certificate of Analysis ${newCoaId}.`);
  };

  const handleQuarantineBatch = () => {
    setBatches((prev) =>
      prev.map((b) =>
        b.id === currentBatch.id
          ? {
              ...b,
              status: 'Quarantine Hold',
              tests: {
                visual: chkVisual,
                dropTest: chkDrop,
                sealLeak: chkLeak,
                weightSpec: chkWeight,
                barcodeScan: chkBarcode,
              },
              inspector: 'Current Inspector',
            }
          : b
      )
    );

    const newNcr: NonConformanceReport = {
      id: `NCR-2026-0${130 + ncrs.length}`,
      source: 'Final Inspection (FQC)',
      item: currentBatch.item,
      itemName: currentBatch.itemName,
      ref: currentBatch.woId,
      lot: currentBatch.lotNumber,
      qty: currentBatch.qty,
      uom: currentBatch.uom,
      severity: 'Major',
      category: 'Final Product Defect',
      description: `Pallet failed pre-dispatch final QC release checklist.`,
      containment: `Pallets held in Quarantine Zone FG-WH-01-QZ. Hold labels applied.`,
      status: 'contained',
      discoveredBy: 'Final QC Inspector',
      discoveredDate: 'Today',
      rca: {
        method: '5-Why',
        whys: ['Pre-dispatch inspection defect detected.'],
        rootCause: 'Under investigation.',
      },
      disposition: {
        action: 'Quarantine & 100% Sort / Rework',
        qty: currentBatch.qty,
        approvedBy: 'QA Supervisor',
      },
      capaId: null,
      history: [{ event: 'NCR raised at final pre-dispatch inspection', time: 'Today' }],
    };

    onCreateNCR(newNcr);
    showToast(`Batch ${currentBatch.lotNumber} quarantined. NCR ${newNcr.id} issued.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-[#0F8B8D] font-bold">
            Quality Management &middot; Pre-Dispatch Release &middot; ISO 9001
          </div>
          <h1 className="text-2xl font-bold text-[#14213D] font-['Space_Grotesk']">
            Final Product Release &amp; Batch QC (FQC)
          </h1>
          <p className="text-xs text-[#6B7280]">
            Pre-shipment batch verification, drop testing, seal leak tests, and authorization of Certificate of Analysis.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('qcoaList')}
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-[#E4E0D6] rounded-lg text-[#14213D] hover:bg-[#F6F4EF] flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#0F8B8D]" /> View Issued COAs
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Pallet Queue */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white p-3 rounded-xl border border-[#E4E0D6] shadow-sm">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[#6B7280]" />
              <input
                type="text"
                placeholder="Search batch, item, WO..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#E4E0D6] rounded-lg focus:outline-none focus:border-[#0F8B8D]"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            {batches.map((batch) => {
              const isSelected = batch.id === currentBatch.id;
              return (
                <div
                  key={batch.id}
                  onClick={() => setSelectedBatchId(batch.id)}
                  className={`p-3.5 bg-white rounded-xl border transition-all cursor-pointer shadow-sm ${
                    isSelected
                      ? 'border-[#0F8B8D] ring-2 ring-[#0F8B8D]/15'
                      : 'border-[#E4E0D6] hover:border-[#0F8B8D]/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#0F8B8D]">{batch.id}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F6F4EF] text-[#6B7280]">
                        {batch.woId}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                        batch.status === 'Released'
                          ? 'bg-emerald-100 text-emerald-800'
                          : batch.status === 'Quarantine Hold'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {batch.status}
                    </span>
                  </div>

                  <div className="font-bold text-xs text-[#14213D] mt-1.5">{batch.itemName}</div>
                  <div className="flex items-center justify-between text-[11px] text-[#6B7280] mt-1">
                    <span>Lot: <strong className="font-mono text-[#14213D]">{batch.lotNumber}</strong></span>
                    <span className="font-mono font-bold text-[#14213D]">
                      {batch.qty.toLocaleString()} {batch.uom} ({batch.palletCount} Pallets)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Final Release Station */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm p-5 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#E4E0D6] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-[#0F8B8D]">{currentBatch.id}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#F6F4EF] text-[#14213D] font-bold">
                    Lot: {currentBatch.lotNumber}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700">
                    {currentBatch.woId}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-[#14213D] mt-1 font-['Space_Grotesk']">
                  {currentBatch.itemName}
                </h2>
                <p className="text-xs text-[#6B7280] font-mono mt-0.5">
                  Batch Total: <strong>{currentBatch.qty.toLocaleString()} {currentBatch.uom}</strong> &middot; Packing: <strong>{currentBatch.palletCount} Stretch-wrapped Pallets</strong>
                </p>
              </div>
              <button
                onClick={() => showToast(`Printed Pallet Release Tags for ${currentBatch.lotNumber}`)}
                className="p-2 text-[#6B7280] hover:text-[#14213D] border border-[#E4E0D6] rounded-lg hover:bg-[#F6F4EF]"
                title="Print Pallet Release Tag"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>

            {/* Checklist */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#14213D] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0F8B8D]" />
                Final Pre-Dispatch Inspection Protocol
              </h3>

              <div className="space-y-2.5">
                {/* 1. Visual & Flash */}
                <div className="p-3 bg-[#F6F4EF] rounded-lg border border-[#E4E0D6] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-[#14213D]">1. Cosmetic Appearance &amp; Deflash</div>
                    <div className="text-[11px] text-[#6B7280]">Zero parting line flash, splay, sink marks, or short shots.</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setChkVisual('pass')}
                      className={`px-2.5 py-1 text-xs font-bold rounded ${
                        chkVisual === 'pass' ? 'bg-emerald-600 text-white' : 'bg-white text-[#6B7280] border'
                      }`}
                    >
                      Pass
                    </button>
                    <button
                      onClick={() => setChkVisual('fail')}
                      className={`px-2.5 py-1 text-xs font-bold rounded ${
                        chkVisual === 'fail' ? 'bg-rose-600 text-white' : 'bg-white text-[#6B7280] border'
                      }`}
                    >
                      Fail
                    </button>
                  </div>
                </div>

                {/* 2. Drop Impact */}
                <div className="p-3 bg-[#F6F4EF] rounded-lg border border-[#E4E0D6] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-[#14213D]">2. Drop Impact Test (ASTM D5276)</div>
                    <div className="text-[11px] text-[#6B7280]">1.2m drop filled with water onto concrete &mdash; zero fracture.</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setChkDrop('pass')}
                      className={`px-2.5 py-1 text-xs font-bold rounded ${
                        chkDrop === 'pass' ? 'bg-emerald-600 text-white' : 'bg-white text-[#6B7280] border'
                      }`}
                    >
                      Pass
                    </button>
                    <button
                      onClick={() => setChkDrop('fail')}
                      className={`px-2.5 py-1 text-xs font-bold rounded ${
                        chkDrop === 'fail' ? 'bg-rose-600 text-white' : 'bg-white text-[#6B7280] border'
                      }`}
                    >
                      Fail
                    </button>
                  </div>
                </div>

                {/* 3. Vacuum Seal Leak */}
                <div className="p-3 bg-[#F6F4EF] rounded-lg border border-[#E4E0D6] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-[#14213D]">3. Vacuum Chamber Seal Leak Test</div>
                    <div className="text-[11px] text-[#6B7280]">-30 kPa vacuum test for 60 seconds with cap assembled.</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setChkLeak('pass')}
                      className={`px-2.5 py-1 text-xs font-bold rounded ${
                        chkLeak === 'pass' ? 'bg-emerald-600 text-white' : 'bg-white text-[#6B7280] border'
                      }`}
                    >
                      Pass
                    </button>
                    <button
                      onClick={() => setChkLeak('fail')}
                      className={`px-2.5 py-1 text-xs font-bold rounded ${
                        chkLeak === 'fail' ? 'bg-rose-600 text-white' : 'bg-white text-[#6B7280] border'
                      }`}
                    >
                      Fail
                    </button>
                  </div>
                </div>

                {/* 4. Weight & Thickness */}
                <div className="p-3 bg-[#F6F4EF] rounded-lg border border-[#E4E0D6] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-[#14213D]">4. Part Weight &amp; Critical Dimensions</div>
                    <div className="text-[11px] text-[#6B7280]">10-unit average within ±1.5% of standard BOM specification.</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setChkWeight('pass')}
                      className={`px-2.5 py-1 text-xs font-bold rounded ${
                        chkWeight === 'pass' ? 'bg-emerald-600 text-white' : 'bg-white text-[#6B7280] border'
                      }`}
                    >
                      Pass
                    </button>
                    <button
                      onClick={() => setChkWeight('fail')}
                      className={`px-2.5 py-1 text-xs font-bold rounded ${
                        chkWeight === 'fail' ? 'bg-rose-600 text-white' : 'bg-white text-[#6B7280] border'
                      }`}
                    >
                      Fail
                    </button>
                  </div>
                </div>

                {/* 5. Barcode & Carton Labeling */}
                <div className="p-3 bg-[#F6F4EF] rounded-lg border border-[#E4E0D6] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-[#14213D]">5. GS1-128 Barcode &amp; Pallet Labeling</div>
                    <div className="text-[11px] text-[#6B7280]">Scanner readability &ge; Grade A, correct lot number and expiry.</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setChkBarcode('pass')}
                      className={`px-2.5 py-1 text-xs font-bold rounded ${
                        chkBarcode === 'pass' ? 'bg-emerald-600 text-white' : 'bg-white text-[#6B7280] border'
                      }`}
                    >
                      Pass
                    </button>
                    <button
                      onClick={() => setChkBarcode('fail')}
                      className={`px-2.5 py-1 text-xs font-bold rounded ${
                        chkBarcode === 'fail' ? 'bg-rose-600 text-white' : 'bg-white text-[#6B7280] border'
                      }`}
                    >
                      Fail
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-4 bg-white rounded-xl border border-[#E4E0D6] flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
              <div>
                <div className="text-xs font-bold text-[#14213D]">Batch Release Authorization</div>
                <div className="text-[11px] text-[#6B7280]">
                  Releasing will sign the batch for dispatch and generate a customer COA.
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleQuarantineBatch}
                  className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-100 flex items-center justify-center gap-1.5"
                >
                  <AlertOctagon className="w-3.5 h-3.5" /> Hold / Raise NCR
                </button>
                <button
                  onClick={handleApproveBatch}
                  className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve &amp; Issue COA
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
