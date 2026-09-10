import React, { useState } from 'react';
import { CertificateOfAnalysis } from '../../types';
import {
  Plus,
  Search,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Award,
  ShieldCheck,
  Send,
} from 'lucide-react';

interface Props {
  coas: CertificateOfAnalysis[];
  selectedId?: string;
  onNavigate: (view: string, param?: any) => void;
  onUpdateCOA: (coa: CertificateOfAnalysis) => void;
  onCreateCOA: (coa: CertificateOfAnalysis) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
}

export const CoaManagementView: React.FC<Props> = ({
  coas,
  selectedId,
  onNavigate,
  onUpdateCOA,
  onCreateCOA,
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  const [activeCoaId, setActiveCoaId] = useState<string>(
    selectedId || coas[0]?.id || 'COA-2026-0453'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredCoas = coas.filter((c) => {
    const matchesStatus =
      statusFilter === 'all' || c.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch =
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.lot.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.product.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const currentCoa = coas.find((c) => c.id === activeCoaId) || filteredCoas[0] || coas[0];

  const handleOpenCreateDrawer = () => {
    let id = `COA-2026-0${500 + coas.length}`;
    let itemCode = 'FG-CTN-500';
    let product = 'Plastic Container 500ml';
    let lot = 'LOT-CTN-05';
    let source = 'Final Inspection Release';
    let mfgDate = '2026-09-01';
    let expiryDate = '2028-09-01';
    let qty = '5,000 PCS';
    let approvedBy = 'Dr. Robert Evans, QA Director';

    openDrawer(
      'Generate New Certificate of Analysis (COA)',
      <div className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">COA Certificate #</label>
            <input
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded bg-[#F6F4EF] font-mono"
              defaultValue={id}
              onChange={(e) => (id = e.target.value)}
            />
          </div>
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Inspection Source</label>
            <input
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded"
              defaultValue={source}
              onChange={(e) => (source = e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Finished Good Code</label>
            <input
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded font-mono"
              defaultValue={itemCode}
              onChange={(e) => (itemCode = e.target.value)}
            />
          </div>
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Product Description</label>
            <input
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded"
              defaultValue={product}
              onChange={(e) => (product = e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Production Batch / Lot #</label>
            <input
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded font-mono"
              defaultValue={lot}
              onChange={(e) => (lot = e.target.value)}
            />
          </div>
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Manufacture Date</label>
            <input
              type="date"
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded"
              defaultValue={mfgDate}
              onChange={(e) => (mfgDate = e.target.value)}
            />
          </div>
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Batch Qty</label>
            <input
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded font-mono"
              defaultValue={qty}
              onChange={(e) => (qty = e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-[#14213D] mb-1">Authorized QA Signatory</label>
          <input
            className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded"
            defaultValue={approvedBy}
            onChange={(e) => (approvedBy = e.target.value)}
          />
        </div>

        <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-teal-800 text-[11px] leading-relaxed">
          <strong>ISO 9001 Compliance:</strong> Analytical tests automatically populate with certified ASTM and ISO laboratory measurements.
        </div>
      </div>,
      <div className="flex justify-end gap-2 w-full">
        <button
          onClick={closeDrawer}
          className="px-3 py-1.5 text-xs font-semibold border border-[#E4E0D6] rounded text-[#6B7280] hover:bg-[#F6F4EF]"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            const newCoa: CertificateOfAnalysis = {
              id,
              product,
              itemCode,
              lot,
              mfgDate,
              expiryDate,
              qty,
              source,
              status: 'Issued',
              approvedBy,
              date: new Date().toISOString().split('T')[0],
              tests: [
                {
                  parameter: 'Wall Thickness (Base)',
                  spec: '0.65 - 0.85 mm',
                  result: '0.74 mm',
                  method: 'ASTM D374 (Ultrasonic)',
                },
                {
                  parameter: 'Melt Flow Index (230°C/2.16kg)',
                  spec: '22.0 - 28.0 g/10min',
                  result: '24.6 g/10min',
                  method: 'ISO 1133 (Plastometer)',
                },
                {
                  parameter: 'Drop Impact Resistance (1.8m @ 4°C)',
                  spec: '0/30 failures',
                  result: 'Pass (0 ruptured)',
                  method: 'ASTM D2463 Free-Fall',
                },
                {
                  parameter: 'Vacuum Seal Integrity (-60 kPa)',
                  spec: '0 bubble leak / 30s',
                  result: 'Pass (0 bubbles)',
                  method: 'ASTM D3078 Chamber',
                },
                {
                  parameter: 'Optical Haze / Clarity',
                  spec: '< 4.5% Haze',
                  result: '2.8% Haze',
                  method: 'ASTM D1003 Spectrophotometer',
                },
              ],
            };
            onCreateCOA(newCoa);
            setActiveCoaId(newCoa.id);
            closeDrawer();
            showToast(`COA ${newCoa.id} successfully generated & authorized.`);
          }}
          className="px-4 py-1.5 text-xs font-semibold bg-[#14213D] text-white rounded hover:bg-[#1f3158]"
        >
          Authorize &amp; Generate COA
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-[#0F8B8D] font-bold">
            Quality Assurance &middot; Product Dispatch Compliance
          </div>
          <h1 className="text-2xl font-bold text-[#14213D] font-['Space_Grotesk']">
            Certificates of Analysis (COA)
          </h1>
          <p className="text-xs text-[#6B7280]">
            Batch analytical release documents, customer compliance specifications, and authorized digital QA signatures.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreateDrawer}
            className="px-3.5 py-1.5 text-xs font-semibold bg-[#14213D] text-white rounded-lg hover:bg-[#1f3158] flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" /> + Generate Batch COA
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E4E0D6] shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-2.5 top-2 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Search COA #, Product, Lot..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#E4E0D6] rounded-lg focus:outline-none focus:border-[#0F8B8D]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-semibold bg-[#F6F4EF] border border-[#E4E0D6] rounded-lg"
          >
            <option value="all">All Statuses</option>
            <option value="Issued">Issued / Released</option>
            <option value="Draft">Draft</option>
            <option value="Under Review">Under Review</option>
          </select>
        </div>
        <div className="text-xs text-[#6B7280] font-mono">
          Showing <strong>{filteredCoas.length}</strong> certificates
        </div>
      </div>

      {/* Master Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: COA Directory */}
        <div className="lg:col-span-5 space-y-3">
          {filteredCoas.map((coa) => {
            const isSelected = coa.id === currentCoa?.id;

            return (
              <div
                key={coa.id}
                onClick={() => setActiveCoaId(coa.id)}
                className={`p-4 bg-white rounded-xl border transition-all cursor-pointer shadow-sm ${
                  isSelected
                    ? 'border-[#0F8B8D] ring-2 ring-[#0F8B8D]/15'
                    : 'border-[#E4E0D6] hover:border-[#0F8B8D]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-[#0F8B8D]">{coa.id}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {coa.status}
                  </span>
                </div>

                <div className="font-bold text-xs text-[#14213D] mt-1.5">
                  {coa.product}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-[#6B7280] mt-2.5 font-mono">
                  <div>
                    Lot: <strong className="text-[#14213D]">{coa.lot}</strong>
                  </div>
                  <div>
                    Qty: <strong>{coa.qty}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#6B7280] mt-3 pt-2 border-t border-[#E4E0D6]">
                  <span className="truncate max-w-[180px]">Source: <strong>{coa.source}</strong></span>
                  <span className="font-mono text-slate-500">{coa.date || coa.mfgDate}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: High Fidelity Printable Certificate */}
        <div className="lg:col-span-7">
          {currentCoa ? (
            <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm p-6 space-y-6">
              {/* Header Badge */}
              <div className="flex items-start justify-between border-b-2 border-[#14213D] pb-4">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#0F8B8D] font-bold">
                    Official Quality Assurance Certificate
                  </div>
                  <h2 className="text-xl font-bold text-[#14213D] font-['Space_Grotesk'] mt-0.5">
                    CERTIFICATE OF ANALYSIS
                  </h2>
                  <p className="text-xs text-[#6B7280] font-mono mt-0.5">
                    Document # <strong className="text-[#14213D]">{currentCoa.id}</strong> &middot; ISO 9001:2015 Accredited Laboratory
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => showToast(`Sent digital COA #${currentCoa.id} to dispatch team`)}
                    className="px-3 py-1.5 text-xs font-semibold border border-[#E4E0D6] rounded-lg text-[#14213D] hover:bg-[#F6F4EF] flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5 text-[#0F8B8D]" /> Email COA
                  </button>
                  <button
                    onClick={() => showToast(`Printed official certificate for ${currentCoa.id}`)}
                    className="p-2 text-[#6B7280] hover:text-[#14213D] border border-[#E4E0D6] rounded-lg hover:bg-[#F6F4EF]"
                    title="Print Document"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Batch Metadata Header */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-[#F6F4EF] rounded-xl border border-[#E4E0D6] text-xs">
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#6B7280]">Product</div>
                  <div className="font-bold text-[#14213D] truncate">{currentCoa.product}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#6B7280]">Item Code</div>
                  <div className="font-mono font-bold text-[#0F8B8D] truncate">{currentCoa.itemCode}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#6B7280]">Lot / Batch #</div>
                  <div className="font-mono font-bold text-[#14213D]">{currentCoa.lot}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#6B7280]">Quantity</div>
                  <div className="font-bold text-[#14213D]">{currentCoa.qty}</div>
                </div>
              </div>

              {/* Laboratory Analytical Parameter Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#14213D] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0F8B8D]" />
                    Analytical Test Specifications &amp; Release Measurements
                  </h3>
                  <span className="text-[11px] text-[#6B7280] font-mono">
                    All specifications comply with ASTM / ISO standards
                  </span>
                </div>

                <div className="overflow-x-auto border border-[#E4E0D6] rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#F6F4EF] text-[#6B7280] text-[10px] uppercase font-bold tracking-wider">
                      <tr>
                        <th className="p-2.5">Test Parameter</th>
                        <th className="p-2.5">Method / Standard</th>
                        <th className="p-2.5">Spec Range</th>
                        <th className="p-2.5">Actual Measured</th>
                        <th className="p-2.5 text-center">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4E0D6]">
                      {currentCoa.tests.map((p, idx) => (
                        <tr key={idx} className="hover:bg-[#F6F4EF]/50">
                          <td className="p-2.5 font-semibold text-[#14213D]">{p.parameter}</td>
                          <td className="p-2.5 text-[#6B7280] font-mono text-[11px]">{p.method || 'Standard ASTM'}</td>
                          <td className="p-2.5 font-mono text-[#6B7280]">{p.spec}</td>
                          <td className="p-2.5 font-mono font-bold text-[#14213D]">{p.result}</td>
                          <td className="p-2.5 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                              PASS
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Lab Certification & Digital Sign-off Section */}
              <div className="p-4 bg-white border border-[#E4E0D6] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-[#14213D] flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-600" />
                    Quality Assurance Release Signatory
                  </div>
                  <p className="text-[#6B7280] text-[11px]">
                    We hereby certify that the above batch has been produced and inspected in accordance with strict QA/QC standards and meets all product specifications.
                  </p>
                  <div className="font-mono text-[11px] text-[#14213D] pt-1">
                    Signatory: <strong>{currentCoa.approvedBy || 'QA Authorization Board'}</strong> &middot; Released: <strong>{currentCoa.date || '2026-09-01'}</strong>
                  </div>
                </div>

                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-center shrink-0 min-w-[130px]">
                  <div className="text-[10px] font-mono font-bold uppercase text-emerald-800 tracking-wider">
                    QA VERIFIED
                  </div>
                  <div className="text-[11px] font-bold text-emerald-900 mt-0.5">
                    BATCH RELEASED
                  </div>
                  <div className="text-[9px] text-emerald-700 font-mono mt-0.5">
                    ID: {currentCoa.id.slice(0, 10)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#6B7280] bg-white rounded-xl border border-[#E4E0D6]">
              Select a Certificate of Analysis from the left to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
