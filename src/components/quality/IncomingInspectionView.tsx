import React, { useState } from 'react';
import { InspectionPlan, NonConformanceReport, PurchaseOrder } from '../../types';
import {
  Inbox,
  CheckCircle2,
  AlertOctagon,
  Search,
  Filter,
  Plus,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  Thermometer,
  Clock,
  ArrowRight,
  Printer,
} from 'lucide-react';

interface Props {
  inspectionPlans: InspectionPlan[];
  ncrs: NonConformanceReport[];
  purchaseOrders?: PurchaseOrder[];
  onNavigate: (view: string, param?: any) => void;
  onCreateNCR: (ncr: NonConformanceReport) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
}

interface IncomingLot {
  id: string;
  poId: string;
  grnId: string;
  item: string;
  itemName: string;
  supplier: string;
  lotNumber: string;
  qty: number;
  uom: string;
  receivedDate: string;
  status: 'Pending Inspection' | 'In Testing' | 'Passed & Released' | 'Quarantined / Rejected';
  mfi: number | null;
  moisture: number | null;
  density: number | null;
  visual: 'Pass' | 'Fail' | null;
  inspector: string;
}

const INITIAL_INCOMING_LOTS: IncomingLot[] = [
  {
    id: 'IQC-2026-081',
    poId: 'PO-3391',
    grnId: 'GRN-4530',
    item: 'RM-HD-GRN-014',
    itemName: 'HDPE Granules — Injection Grade',
    supplier: 'GAIL Polymers',
    lotNumber: 'LOT-GAIL-9902',
    qty: 5000,
    uom: 'KG',
    receivedDate: 'Today, 08:30 AM',
    status: 'Pending Inspection',
    mfi: null,
    moisture: null,
    density: null,
    visual: null,
    inspector: '—',
  },
  {
    id: 'IQC-2026-080',
    poId: 'PO-3392',
    grnId: 'GRN-4528',
    item: 'AD-UV-009',
    itemName: 'UV Stabilizer Additive',
    supplier: 'Borealis India',
    lotNumber: 'LOT-BOR-411',
    qty: 180,
    uom: 'KG',
    receivedDate: 'Yesterday',
    status: 'In Testing',
    mfi: 14.2,
    moisture: 190,
    density: 1.02,
    visual: 'Pass',
    inspector: 'K. Iyer',
  },
  {
    id: 'IQC-2026-079',
    poId: 'PO-3390',
    grnId: 'GRN-4521',
    item: 'RM-PP-NAT-001',
    itemName: 'PP Natural Granules',
    supplier: 'Reliance Polymers',
    lotNumber: 'LOT-001-02',
    qty: 2400,
    uom: 'KG',
    receivedDate: '21 Aug 2026',
    status: 'Passed & Released',
    mfi: 12.1,
    moisture: 180,
    density: 0.905,
    visual: 'Pass',
    inspector: 'J. Menon',
  },
  {
    id: 'IQC-2026-078',
    poId: 'PO-3393',
    grnId: 'GRN-4519',
    item: 'RM-AB-060',
    itemName: 'ABS Resin — Injection Grade',
    supplier: 'Haldia Petrochemicals',
    lotNumber: 'LOT-060-01',
    qty: 2000,
    uom: 'KG',
    receivedDate: '21 Aug 2026',
    status: 'Quarantined / Rejected',
    mfi: 8.2,
    moisture: 420,
    density: 1.05,
    visual: 'Pass',
    inspector: 'Lab Tech',
  },
];

export const IncomingInspectionView: React.FC<Props> = ({
  inspectionPlans,
  ncrs,
  onNavigate,
  onCreateNCR,
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  const [lots, setLots] = useState<IncomingLot[]>(INITIAL_INCOMING_LOTS);
  const [selectedLotId, setSelectedLotId] = useState<string>(lots[0].id);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredLots = lots.filter((l) => {
    const matchesFilter = statusFilter === 'all' || l.status.toLowerCase().includes(statusFilter.toLowerCase());
    const matchesSearch =
      l.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const currentLot = lots.find((l) => l.id === selectedLotId) || filteredLots[0] || lots[0];

  // Testing Station State for Active Lot
  const [testMFI, setTestMFI] = useState<string>('11.8');
  const [testMoisture, setTestMoisture] = useState<string>('185');
  const [testDensity, setTestDensity] = useState<string>('0.954');
  const [testVisual, setTestVisual] = useState<'Pass' | 'Fail'>('Pass');

  const handleRecordTestPass = () => {
    setLots((prev) =>
      prev.map((l) =>
        l.id === currentLot.id
          ? {
              ...l,
              status: 'Passed & Released',
              mfi: parseFloat(testMFI) || 12.0,
              moisture: parseFloat(testMoisture) || 180,
              density: parseFloat(testDensity) || 0.95,
              visual: testVisual,
              inspector: 'Current QA Inspector',
            }
          : l
      )
    );
    showToast(`Lot ${currentLot.lotNumber} passed IQC and released to RM Warehouse!`);
  };

  const handleRejectAndRaiseNCR = () => {
    setLots((prev) =>
      prev.map((l) =>
        l.id === currentLot.id
          ? {
              ...l,
              status: 'Quarantined / Rejected',
              mfi: parseFloat(testMFI) || 8.0,
              moisture: parseFloat(testMoisture) || 450,
              density: parseFloat(testDensity) || 1.05,
              visual: testVisual,
              inspector: 'Current QA Inspector',
            }
          : l
      )
    );

    const newNcr: NonConformanceReport = {
      id: `NCR-2026-0${120 + ncrs.length}`,
      source: 'Incoming Inspection (IQC)',
      item: currentLot.item,
      itemName: currentLot.itemName,
      ref: currentLot.poId,
      lot: currentLot.lotNumber,
      qty: currentLot.qty,
      uom: currentLot.uom,
      severity: 'Major',
      category: 'Material — Out of Spec (MFI / Moisture)',
      description: `Incoming receipt failed IQC parameters. Measured MFI: ${testMFI} g/10min, Moisture: ${testMoisture} ppm.`,
      containment: `Quarantine tag placed on pallet. Material moved to Quarantine Zone RM-WH-01-QZ.`,
      status: 'contained',
      discoveredBy: 'Incoming QA Inspector',
      discoveredDate: 'Today',
      rca: {
        method: '5-Why',
        whys: ['MFI / moisture drifted out of specification limits on delivery.'],
        rootCause: 'Under investigation with supplier technical desk.',
      },
      disposition: {
        action: 'Return to Supplier (RTV)',
        qty: currentLot.qty,
        approvedBy: 'Quality Manager',
      },
      capaId: null,
      history: [{ event: `NCR automatically raised from Incoming IQC station`, time: 'Today' }],
    };

    onCreateNCR(newNcr);
    showToast(`Lot ${currentLot.lotNumber} quarantined. NCR ${newNcr.id} created.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-[#0F8B8D] font-bold">
            Quality Management &middot; Inbound Material Control
          </div>
          <h1 className="text-2xl font-bold text-[#14213D] font-['Space_Grotesk']">
            Incoming Raw Material Inspection (IQC)
          </h1>
          <p className="text-xs text-[#6B7280]">
            Verify polymer granules, masterbatches, and packaging receipts against ASTM/ISO specifications before stocking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('inspectionPlanList')}
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-[#E4E0D6] rounded-lg text-[#14213D] hover:bg-[#F6F4EF]"
          >
            View Inspection Plans
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-3.5 bg-white rounded-xl border border-[#E4E0D6] shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[#6B7280]">Pending IQC Lots</div>
          <div className="text-xl font-bold text-[#14213D] font-mono mt-1">
            {lots.filter((l) => l.status === 'Pending Inspection').length} Lots
          </div>
          <div className="text-[11px] text-amber-700 mt-0.5">Awaiting lab testing</div>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-[#E4E0D6] shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[#6B7280]">Lots in Testing</div>
          <div className="text-xl font-bold text-[#0F8B8D] font-mono mt-1">
            {lots.filter((l) => l.status === 'In Testing').length} Lots
          </div>
          <div className="text-[11px] text-[#6B7280] mt-0.5">MFI / Moisture analysis</div>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-[#E4E0D6] shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[#6B7280]">Released (Pass Rate)</div>
          <div className="text-xl font-bold text-emerald-700 font-mono mt-1">94.2%</div>
          <div className="text-[11px] text-emerald-700 mt-0.5">Passed ISO specs</div>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-[#E4E0D6] shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[#6B7280]">Quarantined / Rejected</div>
          <div className="text-xl font-bold text-rose-600 font-mono mt-1">
            {lots.filter((l) => l.status.includes('Quarantined')).length} Lots
          </div>
          <div className="text-[11px] text-rose-700 mt-0.5">NCR &amp; RTV generated</div>
        </div>
      </div>

      {/* Main Workbench Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Inbound Receipts Queue */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white p-3 rounded-xl border border-[#E4E0D6] shadow-sm space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[#6B7280]" />
              <input
                type="text"
                placeholder="Search inbound lot, PO, supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#E4E0D6] rounded-lg focus:outline-none focus:border-[#0F8B8D]"
              />
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1 text-[11px]">
              {['all', 'Pending', 'In Testing', 'Passed', 'Quarantined'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab === 'all' ? 'all' : tab)}
                  className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap transition-colors ${
                    statusFilter.toLowerCase() === tab.toLowerCase() || (tab === 'all' && statusFilter === 'all')
                      ? 'bg-[#0F8B8D] text-white'
                      : 'text-[#6B7280] hover:bg-[#F6F4EF]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredLots.map((lot) => {
              const isSelected = lot.id === currentLot?.id;
              return (
                <div
                  key={lot.id}
                  onClick={() => setSelectedLotId(lot.id)}
                  className={`p-3.5 bg-white rounded-xl border transition-all cursor-pointer shadow-sm ${
                    isSelected
                      ? 'border-[#0F8B8D] ring-2 ring-[#0F8B8D]/15'
                      : 'border-[#E4E0D6] hover:border-[#0F8B8D]/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#0F8B8D]">{lot.id}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F6F4EF] text-[#6B7280]">
                        {lot.poId}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                        lot.status === 'Passed & Released'
                          ? 'bg-emerald-100 text-emerald-800'
                          : lot.status === 'In Testing'
                          ? 'bg-teal-100 text-teal-800'
                          : lot.status.includes('Quarantined')
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {lot.status}
                    </span>
                  </div>

                  <div className="font-bold text-xs text-[#14213D] mt-1.5">{lot.itemName}</div>
                  <div className="flex items-center justify-between text-[11px] text-[#6B7280] mt-1">
                    <span>Vendor: <strong className="text-[#14213D]">{lot.supplier}</strong></span>
                    <span className="font-mono font-bold text-[#14213D]">
                      {lot.qty.toLocaleString()} {lot.uom}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#6B7280] font-mono mt-2 pt-2 border-t border-[#E4E0D6]">
                    <span>Lot: {lot.lotNumber}</span>
                    <span>{lot.receivedDate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Inspection Station & Testing Deck */}
        <div className="lg:col-span-7">
          {currentLot ? (
            <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm p-5 space-y-5">
              {/* Station Header */}
              <div className="flex items-start justify-between border-b border-[#E4E0D6] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[#0F8B8D]">{currentLot.id}</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#F6F4EF] text-[#6B7280]">
                      GRN: {currentLot.grnId}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                      Standard: ISO 2859 Level II
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-[#14213D] mt-1 font-['Space_Grotesk']">
                    {currentLot.itemName}
                  </h2>
                  <p className="text-xs text-[#6B7280] font-mono mt-0.5">
                    Lot: <strong>{currentLot.lotNumber}</strong> &middot; Supplier: <strong>{currentLot.supplier}</strong> &middot; Quantity: <strong>{currentLot.qty.toLocaleString()} {currentLot.uom}</strong>
                  </p>
                </div>
                <button
                  onClick={() => showToast(`Printed IQC Sample Identification Tag for ${currentLot.lotNumber}`)}
                  className="p-2 text-[#6B7280] hover:text-[#14213D] border border-[#E4E0D6] rounded-lg hover:bg-[#F6F4EF]"
                  title="Print Sample Tag"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>

              {/* IQC Testing Form */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#14213D] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0F8B8D]" />
                    Lab Analysis &amp; Physical Inspection Checklist
                  </h3>
                  <span className="text-[11px] text-[#6B7280]">Sampling: 5 bags per lot</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Parameter 1: MFI */}
                  <div className="p-3.5 bg-[#F6F4EF] rounded-xl border border-[#E4E0D6] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#14213D]">1. Melt Flow Index (MFI)</span>
                      <span className="text-[10px] font-mono text-[#0F8B8D] font-bold">ASTM D1238</span>
                    </div>
                    <div className="text-[10px] text-[#6B7280]">Spec Limit: 10.5 &ndash; 13.5 g/10min (230°C / 2.16kg)</div>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="number"
                        step="0.1"
                        value={testMFI}
                        onChange={(e) => setTestMFI(e.target.value)}
                        className="w-28 px-2 py-1 text-xs font-mono font-bold bg-white border border-[#E4E0D6] rounded"
                      />
                      <span className="text-xs text-[#6B7280] font-mono">g/10min</span>
                      {parseFloat(testMFI) >= 10.5 && parseFloat(testMFI) <= 13.5 ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                          In Spec
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                          Out of Spec
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Parameter 2: Moisture */}
                  <div className="p-3.5 bg-[#F6F4EF] rounded-xl border border-[#E4E0D6] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#14213D]">2. Moisture Content</span>
                      <span className="text-[10px] font-mono text-[#0F8B8D] font-bold">Karl Fischer</span>
                    </div>
                    <div className="text-[10px] text-[#6B7280]">Spec Limit: &le; 300 ppm max</div>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="number"
                        value={testMoisture}
                        onChange={(e) => setTestMoisture(e.target.value)}
                        className="w-28 px-2 py-1 text-xs font-mono font-bold bg-white border border-[#E4E0D6] rounded"
                      />
                      <span className="text-xs text-[#6B7280] font-mono">ppm</span>
                      {parseFloat(testMoisture) <= 300 ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                          In Spec
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                          High Moisture
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Parameter 3: Density */}
                  <div className="p-3.5 bg-[#F6F4EF] rounded-xl border border-[#E4E0D6] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#14213D]">3. Polymer Density</span>
                      <span className="text-[10px] font-mono text-[#0F8B8D] font-bold">ASTM D792</span>
                    </div>
                    <div className="text-[10px] text-[#6B7280]">Spec Limit: 0.900 &ndash; 0.965 g/cm³</div>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="number"
                        step="0.001"
                        value={testDensity}
                        onChange={(e) => setTestDensity(e.target.value)}
                        className="w-28 px-2 py-1 text-xs font-mono font-bold bg-white border border-[#E4E0D6] rounded"
                      />
                      <span className="text-xs text-[#6B7280] font-mono">g/cm³</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        In Spec
                      </span>
                    </div>
                  </div>

                  {/* Parameter 4: Visual & Contamination */}
                  <div className="p-3.5 bg-[#F6F4EF] rounded-xl border border-[#E4E0D6] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#14213D]">4. Visual Contamination</span>
                      <span className="text-[10px] font-mono text-[#0F8B8D] font-bold">20x Optical</span>
                    </div>
                    <div className="text-[10px] text-[#6B7280]">Black specks, foreign particles, pellet shape</div>
                    <div className="flex items-center gap-3 mt-2">
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <input
                          type="radio"
                          name="visCheck"
                          checked={testVisual === 'Pass'}
                          onChange={() => setTestVisual('Pass')}
                        />
                        <span className="font-semibold text-emerald-700">Pass (Clean)</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <input
                          type="radio"
                          name="visCheck"
                          checked={testVisual === 'Fail'}
                          onChange={() => setTestVisual('Fail')}
                        />
                        <span className="font-semibold text-rose-700">Fail (Contaminated)</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Disposition Action Bar */}
              <div className="p-4 bg-white rounded-xl border border-[#E4E0D6] flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
                <div>
                  <div className="text-xs font-bold text-[#14213D]">Inspection Disposition Decision</div>
                  <div className="text-[11px] text-[#6B7280]">
                    Release lot into raw material warehouse or quarantine for NCR disposition.
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleRejectAndRaiseNCR}
                    className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-100 flex items-center justify-center gap-1.5"
                  >
                    <AlertOctagon className="w-3.5 h-3.5" /> Reject &amp; Raise NCR
                  </button>
                  <button
                    onClick={handleRecordTestPass}
                    className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Pass &amp; Release Lot
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#6B7280] bg-white rounded-xl border border-[#E4E0D6]">
              Select an incoming lot from the queue to start quality testing.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
