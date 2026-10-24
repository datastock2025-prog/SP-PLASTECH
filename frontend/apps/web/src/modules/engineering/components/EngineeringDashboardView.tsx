import React from 'react';
import { BomMaster, EngineeringChangeRequest, EngineeringChangeOrder } from '@/src/types';
import {
  Cpu,
  Plus,
  GitBranch,
  Boxes,
  FileCheck,
  FolderTree,
  Scale,
  GitCompare,
  Search,
} from 'lucide-react';

export interface EngineeringDashboardViewProps {
  effectiveBoms: BomMaster[];
  boms: BomMaster[];
  ecrs: EngineeringChangeRequest[];
  ecos: EngineeringChangeOrder[];
  onNavigate: (view: string, param?: any) => void;
  onOpenWizard: () => void;
  onUpdateBom: (bom: BomMaster) => void;
  showToast: (msg: string) => void;
}

export const EngineeringDashboardView: React.FC<EngineeringDashboardViewProps> = ({
  effectiveBoms,
  boms,
  ecrs,
  ecos,
  onNavigate,
  onOpenWizard,
  onUpdateBom,
  showToast,
}) => {
  const totalActive = effectiveBoms.filter((b) => b.status === 'released').length;
  const drafts = effectiveBoms.filter((b) => b.status === 'draft').length;
  const pendingApproval = effectiveBoms.filter((b) => b.status === 'pending' || b.status === 'under_review').length;
  const openEcrs = ecrs.filter((e) => e.status !== 'Closed').length;
  const openEcos = ecos.filter((e) => e.status !== 'Closed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-[#0F8B8D] font-bold flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" /> Engineering &amp; Product Architecture
          </div>
          <h1 className="text-2xl font-bold text-[#14213D]">BOM &amp; Recipe Engineering Center</h1>
          <p className="text-xs text-[#6B7280]">
            Multi-level plastic formulas, masterbatch dosages, mold parameters, ECR/ECO change control &amp; cost rollups.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenWizard}
            className="btn btn-sm btn-primary flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Create Manufacturing BOM
          </button>
          <button
            onClick={() => onNavigate('ecrList')}
            className="btn btn-sm btn-ghost border-[#E4E0D6] flex items-center gap-1.5"
          >
            <GitBranch className="w-3.5 h-3.5 text-[#E8622C]" /> New ECR
          </button>
        </div>
      </div>

      {/* 13 KPI Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="kpi-card bg-white p-3 rounded-lg border border-[#E4E0D6] shadow-xs">
          <div className="lbl text-[11px] text-[#6B7280]">Total Active BOMs</div>
          <div className="val text-xl font-bold text-[#14213D] mt-1">{totalActive}</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">IATF 16949 Validated</div>
        </div>
        <div className="kpi-card bg-white p-3 rounded-lg border border-[#E4E0D6] shadow-xs">
          <div className="lbl text-[11px] text-[#6B7280]">Draft / In-Design</div>
          <div className="val text-xl font-bold text-[#6B7280] mt-1">{drafts}</div>
          <div className="text-[10px] text-[#9CA3AF] mt-0.5">Work In Progress</div>
        </div>
        <div className="kpi-card bg-white p-3 rounded-lg border border-[#E4E0D6] shadow-xs">
          <div className="lbl text-[11px] text-[#6B7280]">Pending Approval</div>
          <div className="val text-xl font-bold text-amber-600 mt-1">{pendingApproval}</div>
          <div className="text-[10px] text-amber-600 font-medium mt-0.5">QA &amp; Cost Signoff</div>
        </div>
        <div className="kpi-card bg-white p-3 rounded-lg border border-[#E4E0D6] shadow-xs">
          <div className="lbl text-[11px] text-[#6B7280]">Open ECR Requests</div>
          <div className="val text-xl font-bold text-[#E8622C] mt-1">{openEcrs}</div>
          <div className="text-[10px] text-[#E8622C] font-medium mt-0.5">Engineering Changes</div>
        </div>
        <div className="kpi-card bg-white p-3 rounded-lg border border-[#E4E0D6] shadow-xs">
          <div className="lbl text-[11px] text-[#6B7280]">Open ECO Orders</div>
          <div className="val text-xl font-bold text-purple-600 mt-1">{openEcos}</div>
          <div className="text-[10px] text-purple-600 font-medium mt-0.5">Floor Implementation</div>
        </div>
        <div className="kpi-card bg-white p-3 rounded-lg border border-[#E4E0D6] shadow-xs">
          <div className="lbl text-[11px] text-[#6B7280]">Avg BOM Cost Variance</div>
          <div className="val text-xl font-bold text-emerald-600 mt-1">-1.8%</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Regrind Offset Benefit</div>
        </div>
      </div>

      {/* Process Breakdown & Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Plastic Process Breakdown */}
        <div className="panel bg-white p-4 rounded-xl border border-[#E4E0D6] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D6]">
            <h3 className="font-bold text-sm text-[#14213D] flex items-center gap-2">
              <Boxes className="w-4 h-4 text-[#0F8B8D]" /> Process Architecture Distribution
            </h3>
          </div>
          <div className="mt-4 space-y-3">
            {[
              { name: 'Injection Molding (IMM)', count: 18, pct: 65, color: 'bg-[#0F8B8D]' },
              { name: 'Blow Molding (Bottles)', count: 5, pct: 18, color: 'bg-[#E8622C]' },
              { name: 'Extrusion & Profiles', count: 3, pct: 10, color: 'bg-amber-500' },
              { name: 'Compounding & Blending', count: 2, pct: 7, color: 'bg-purple-500' },
            ].map((p, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-[#374151]">
                  <span>{p.name}</span>
                  <span className="font-mono text-[#6B7280]">{p.count} BOMs ({p.pct}%)</span>
                </div>
                <div className="w-full h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                  <div className={`h-full ${p.color} rounded-full`} style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-[#E4E0D6] flex justify-between text-xs text-[#6B7280]">
            <span>Standard Batch Size: 1,000 PCS</span>
            <span className="text-[#0F8B8D] font-semibold">100% Formulas Balanced</span>
          </div>
        </div>

        {/* Pending Engineering Approvals */}
        <div className="panel bg-white p-4 rounded-xl border border-[#E4E0D6] shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D6]">
            <h3 className="font-bold text-sm text-[#14213D] flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#E8622C]" /> Pending Engineering Approvals &amp; Stage Gates
            </h3>
            <button
              onClick={() => onNavigate('approvalWorkflow')}
              className="text-xs text-[#0F8B8D] font-semibold hover:underline"
            >
              View Workflow Hub &rarr;
            </button>
          </div>
          <div className="divide-y divide-[#F3F4F6] mt-2">
            {boms.slice(0, 3).map((b) => (
              <div key={b.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[#14213D]">{b.id}</span>
                    <span className="font-semibold text-xs text-[#374151] truncate">{b.parentName}</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-[#F6F4EF] rounded font-mono text-[#6B7280]">{b.version}</span>
                  </div>
                  <div className="text-[11px] text-[#6B7280] mt-0.5 flex items-center gap-3">
                    <span>Owner: {b.owner || 'Vikram Singh'}</span>
                    <span>&bull;</span>
                    <span>Process: {b.processType || 'Injection Molding'}</span>
                    <span>&bull;</span>
                    <span>Stage: <b className="text-amber-700">{b.approvalStage || 'Engineering Review'}</b></span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onNavigate('bomDetail', { id: b.id })}
                    className="px-2.5 py-1 text-xs font-semibold rounded bg-[#F6F4EF] hover:bg-[#E5E7EB] text-[#14213D] transition-colors"
                  >
                    Review
                  </button>
                  <button
                    onClick={() => {
                      onUpdateBom({ ...b, status: 'approved', approvalStage: 'Approved' });
                      showToast(`Approved ${b.id}`);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Engineering Jump Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => onNavigate('bomTree')}
          className="p-3 bg-white border border-[#E4E0D6] rounded-xl hover:border-[#0F8B8D] transition-all cursor-pointer shadow-xs group"
        >
          <FolderTree className="w-5 h-5 text-[#0F8B8D] mb-2 group-hover:scale-110 transition-transform" />
          <div className="font-bold text-xs text-[#14213D]">Multi-Level BOM Tree</div>
          <div className="text-[11px] text-[#6B7280]">Visual component hierarchies &amp; sprue rollups</div>
        </div>
        <div
          onClick={() => onNavigate('recipeFormula')}
          className="p-3 bg-white border border-[#E4E0D6] rounded-xl hover:border-[#0F8B8D] transition-all cursor-pointer shadow-xs group"
        >
          <Scale className="w-5 h-5 text-[#E8622C] mb-2 group-hover:scale-110 transition-transform" />
          <div className="font-bold text-xs text-[#14213D]">Formula &amp; Recipe Scaler</div>
          <div className="text-[11px] text-[#6B7280]">Percentage compounding &amp; resin balancer</div>
        </div>
        <div
          onClick={() => onNavigate('bomCompare')}
          className="p-3 bg-white border border-[#E4E0D6] rounded-xl hover:border-[#0F8B8D] transition-all cursor-pointer shadow-xs group"
        >
          <GitCompare className="w-5 h-5 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
          <div className="font-bold text-xs text-[#14213D]">BOM Version Comparison</div>
          <div className="text-[11px] text-[#6B7280]">Side-by-side diff between revisions</div>
        </div>
        <div
          onClick={() => onNavigate('whereUsed')}
          className="p-3 bg-white border border-[#E4E0D6] rounded-xl hover:border-[#0F8B8D] transition-all cursor-pointer shadow-xs group"
        >
          <Search className="w-5 h-5 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
          <div className="font-bold text-xs text-[#14213D]">Where-Used Analysis</div>
          <div className="text-[11px] text-[#6B7280]">Impact analysis &amp; mass replacements</div>
        </div>
      </div>
    </div>
  );
};
