import React from 'react';
import {
  InspectionPlan,
  NonConformanceReport,
  CapaReport,
  CertificateOfAnalysis,
  ItemMaster,
  Supplier,
  WorkOrder,
} from '../../types';
import {
  CheckSquare,
  AlertOctagon,
  Wrench,
  BarChart3,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Award,
  ShieldCheck,
  Clock,
  ArrowRight,
  FileSpreadsheet,
  Activity,
  Layers,
  Inbox,
  Ruler,
} from 'lucide-react';

interface Props {
  inspectionPlans: InspectionPlan[];
  ncrs: NonConformanceReport[];
  capas: CapaReport[];
  coas: CertificateOfAnalysis[];
  items?: ItemMaster[];
  suppliers?: Supplier[];
  workOrders?: WorkOrder[];
  onNavigate: (view: string, param?: any) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
}

export const QualityDashboardView: React.FC<Props> = ({
  inspectionPlans,
  ncrs,
  capas,
  coas,
  onNavigate,
  showToast,
}) => {
  const openNCRs = ncrs.filter((n) => n.status !== 'closed' && n.status !== 'waived');
  const criticalNCRs = openNCRs.filter((n) => n.severity === 'Critical');
  const openCAPAs = capas.filter((c) => c.stage !== 'close');
  const verifiedCOAs = coas.filter((c) => c.status === 'Issued' || c.status === 'Signed' || c.status === 'Approved');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-[#0F8B8D] font-bold">
            Quality Assurance &middot; ISO 9001:2015 &middot; IATF 16949
          </div>
          <h1 className="text-2xl font-bold text-[#14213D] font-['Space_Grotesk']">
            Quality Command Center
          </h1>
          <p className="text-xs text-[#6B7280]">
            Plant-wide quality governance, in-process SPC monitoring, 8D CAPA resolution, and batch COA compliance.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigate('spcMonitor')}
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-[#E4E0D6] rounded-lg text-[#14213D] hover:bg-[#F6F4EF] flex items-center gap-1.5 shadow-sm"
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#0F8B8D]" /> In-Process SPC
          </button>
          <button
            onClick={() => onNavigate('incomingInspection')}
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-[#E4E0D6] rounded-lg text-[#14213D] hover:bg-[#F6F4EF] flex items-center gap-1.5 shadow-sm"
          >
            <Inbox className="w-3.5 h-3.5 text-[#E8622C]" /> Incoming IQC
          </button>
          <button
            onClick={() => onNavigate('ncrList')}
            className="px-3.5 py-1.5 text-xs font-semibold bg-[#14213D] text-white rounded-lg hover:bg-[#1f3158] flex items-center gap-1.5 shadow-sm"
          >
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" /> + Raise NCR
          </button>
        </div>
      </div>

      {/* KPI Header Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* FPY */}
        <div className="p-4 bg-white rounded-xl border border-[#E4E0D6] shadow-sm hover:border-[#0F8B8D] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#6B7280] tracking-wider">
              First Pass Yield (FPY)
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-[#14213D] font-mono mt-2">98.4%</div>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-700 font-medium">
            <TrendingUp className="w-3 h-3" /> +0.6% vs monthly benchmark
          </div>
        </div>

        {/* Process Capability Cpk */}
        <div className="p-4 bg-white rounded-xl border border-[#E4E0D6] shadow-sm hover:border-[#0F8B8D] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#6B7280] tracking-wider">
              Process Capability (Cpk)
            </span>
            <span className="p-1.5 rounded-lg bg-teal-50 text-[#0F8B8D]">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-[#0F8B8D] font-mono mt-2">1.48</div>
          <div className="text-[11px] text-[#6B7280] mt-1">
            Six-Sigma compliant (&ge; 1.33 target)
          </div>
        </div>

        {/* Open NCRs */}
        <div className="p-4 bg-white rounded-xl border border-[#E4E0D6] shadow-sm hover:border-rose-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#6B7280] tracking-wider">
              Active NCRs
            </span>
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <AlertOctagon className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-rose-600 font-mono mt-2">{openNCRs.length}</div>
          <div className="text-[11px] text-[#6B7280] mt-1">
            {criticalNCRs.length > 0 ? (
              <span className="text-rose-700 font-semibold">{criticalNCRs.length} Critical quarantine hold</span>
            ) : (
              '0 Critical holds active'
            )}
          </div>
        </div>

        {/* Active CAPAs */}
        <div className="p-4 bg-white rounded-xl border border-[#E4E0D6] shadow-sm hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#6B7280] tracking-wider">
              8D CAPA Investigations
            </span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
              <Wrench className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-700 font-mono mt-2">{openCAPAs.length}</div>
          <div className="text-[11px] text-[#6B7280] mt-1">
            In root cause verification &amp; action
          </div>
        </div>
      </div>

      {/* Quality Life-Cycle Status Matrix */}
      <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0F8B8D]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#14213D]">
              Plant Quality Execution Gateways
            </h2>
          </div>
          <span className="text-[11px] text-[#6B7280]">Real-time shift inspection checkpoints</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          <div
            onClick={() => onNavigate('incomingInspection')}
            className="p-3 bg-[#F6F4EF] rounded-lg border border-[#E4E0D6] cursor-pointer hover:border-[#0F8B8D] transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#6B7280]">IQC Incoming</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                Active
              </span>
            </div>
            <div className="font-bold text-sm text-[#14213D] mt-1">Raw Polymer &amp; MB</div>
            <div className="text-[11px] text-[#6B7280] mt-0.5">3 lots pending MFI / Moisture check</div>
          </div>

          <div
            onClick={() => onNavigate('spcMonitor')}
            className="p-3 bg-[#F6F4EF] rounded-lg border border-[#E4E0D6] cursor-pointer hover:border-[#0F8B8D] transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#6B7280]">IPQC In-Process</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                Normal
              </span>
            </div>
            <div className="font-bold text-sm text-[#14213D] mt-1">Line 1, 2, 3 Molding</div>
            <div className="text-[11px] text-[#6B7280] mt-0.5">X-bar &amp; R control within &plusmn;3&sigma;</div>
          </div>

          <div
            onClick={() => onNavigate('finalInspection')}
            className="p-3 bg-[#F6F4EF] rounded-lg border border-[#E4E0D6] cursor-pointer hover:border-[#0F8B8D] transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#6B7280]">FQC Final Release</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                1 on hold
              </span>
            </div>
            <div className="font-bold text-sm text-[#14213D] mt-1">Batch Pallet Release</div>
            <div className="text-[11px] text-[#6B7280] mt-0.5">4 pallets released, 1 lot sampling</div>
          </div>

          <div
            onClick={() => onNavigate('calibrationList')}
            className="p-3 bg-[#F6F4EF] rounded-lg border border-[#E4E0D6] cursor-pointer hover:border-[#0F8B8D] transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#6B7280]">MSA &amp; Calibration</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800">
                1 Overdue
              </span>
            </div>
            <div className="font-bold text-sm text-[#14213D] mt-1">Lab &amp; Floor Gauges</div>
            <div className="text-[11px] text-[#6B7280] mt-0.5">Spectrophotometer calibration due</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Active NCRs and 8D CAPAs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NCR Table Panel */}
        <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#E4E0D6] bg-[#F6F4EF]/50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#14213D] font-['Space_Grotesk'] flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                Active Non-Conformance Reports (NCR)
              </h2>
              <p className="text-[11px] text-[#6B7280]">Containment, root-cause isolation, and disposition</p>
            </div>
            <button
              onClick={() => onNavigate('ncrList')}
              className="text-xs font-semibold text-[#0F8B8D] hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F6F4EF] border-b border-[#E4E0D6] text-[#6B7280] text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">NCR #</th>
                  <th className="py-2.5 px-3">Item / Lot</th>
                  <th className="py-2.5 px-3">Defect Summary</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D6]">
                {ncrs.slice(0, 5).map((n) => (
                  <tr
                    key={n.id}
                    onClick={() => onNavigate('ncrDetail', { id: n.id })}
                    className="hover:bg-[#F6F4EF]/60 transition-colors cursor-pointer"
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-[#0F8B8D]">{n.id}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-[#14213D]">{n.item}</div>
                      <div className="text-[10px] text-[#6B7280] font-mono">{n.lot || n.ref}</div>
                    </td>
                    <td className="py-2.5 px-3 text-[#14213D] max-w-[200px] truncate">
                      {n.description}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          n.severity === 'Critical'
                            ? 'bg-rose-100 text-rose-800'
                            : n.severity === 'Major'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {n.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-teal-50 text-[#0F8B8D] border border-teal-200">
                        {n.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active CAPA 8D Investigations Panel */}
        <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#E4E0D6] bg-[#F6F4EF]/50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#14213D] font-['Space_Grotesk'] flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-600" />
                Active 8D CAPA Initiatives
              </h2>
              <p className="text-[11px] text-[#6B7280]">Corrective &amp; preventive systemic resolutions</p>
            </div>
            <button
              onClick={() => onNavigate('capaList')}
              className="text-xs font-semibold text-[#0F8B8D] hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-[#E4E0D6] flex-1">
            {capas.map((c) => (
              <div
                key={c.id}
                onClick={() => onNavigate('capaDetail', { id: c.id })}
                className="p-3.5 hover:bg-[#F6F4EF]/50 transition-colors cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[#0F8B8D]">{c.id}</span>
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                      {c.type}
                    </span>
                    <span className="text-[10px] text-[#6B7280] font-mono">Ref: {c.sourceRef}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    Stage: {c.stage}
                  </span>
                </div>

                <div className="text-xs font-semibold text-[#14213D]">{c.problem}</div>

                <div className="flex items-center justify-between text-[11px] text-[#6B7280] pt-1">
                  <span>Owner: <strong className="text-[#14213D]">{c.owner}</strong></span>
                  <span className="font-mono">Due: {c.dueDate}</span>
                </div>

                {/* Progress Mini Bar */}
                <div className="w-full bg-[#E4E0D6] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#0F8B8D] h-full rounded-full"
                    style={{
                      width:
                        c.stage === 'close'
                          ? '100%'
                          : c.stage === 'verify'
                          ? '85%'
                          : c.stage === 'implement'
                          ? '70%'
                          : c.stage === 'action'
                          ? '50%'
                          : '25%',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quality Modules Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { id: 'inspectionPlanList', name: 'Inspection Plans', desc: 'AQL test protocols', icon: Ruler },
          { id: 'incomingInspection', name: 'Incoming IQC', desc: 'Resin & MB inspection', icon: Inbox },
          { id: 'spcMonitor', name: 'In-Process SPC', desc: 'X̄-R charts & Cpk', icon: BarChart3 },
          { id: 'finalInspection', name: 'Final FQC', desc: 'Batch drop & seal test', icon: CheckCircle2 },
          { id: 'qcoaList', name: 'Certificates (COA)', desc: 'Batch release COAs', icon: FileSpreadsheet },
          { id: 'supplierScorecard', name: 'Supplier Quality', desc: 'Vendor PPM & audits', icon: Award },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="p-3 bg-white rounded-xl border border-[#E4E0D6] shadow-sm hover:border-[#0F8B8D] hover:shadow transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#F6F4EF] flex items-center justify-center text-[#14213D] group-hover:bg-[#0F8B8D] group-hover:text-white transition-colors mb-2">
                <Icon className="w-4 h-4" />
              </div>
              <div className="font-bold text-xs text-[#14213D]">{item.name}</div>
              <div className="text-[10px] text-[#6B7280] mt-0.5">{item.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
