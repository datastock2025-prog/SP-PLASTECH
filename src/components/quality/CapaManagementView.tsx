import React, { useState } from 'react';
import { CapaReport, NonConformanceReport } from '../../types';
import {
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ArrowRight,
  CheckSquare,
  Printer,
  Calendar,
  Layers,
  Send,
  Sparkles,
} from 'lucide-react';

interface Props {
  capas: CapaReport[];
  ncrs?: NonConformanceReport[];
  selectedId?: string;
  onNavigate: (view: string, param?: any) => void;
  onUpdateCAPA: (capa: CapaReport) => void;
  onCreateCAPA: (capa: CapaReport) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
}

const EIGHT_D_STAGES: Array<{ key: CapaReport['stage']; label: string; desc: string }> = [
  { key: 'define', label: 'D1: Team & Scope', desc: 'Cross-functional problem team' },
  { key: 'contain', label: 'D2/D3: Containment', desc: 'Quarantine & protect customer' },
  { key: 'rootcause', label: 'D4: Root Cause (RCA)', desc: '5-Why & Ishikawa Fishbone' },
  { key: 'action', label: 'D5: Corrective Actions', desc: 'Permanent root cause fix' },
  { key: 'implement', label: 'D6: Implementation', desc: 'Pilot run & statistical verification' },
  { key: 'verify', label: 'D7: Prevent Recurrence', desc: 'Update SOP, FMEA & Control Plan' },
  { key: 'close', label: 'D8: Team Recognition', desc: 'Formal QA Head Sign-off' },
];

export const CapaManagementView: React.FC<Props> = ({
  capas,
  ncrs = [],
  selectedId,
  onNavigate,
  onUpdateCAPA,
  onCreateCAPA,
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  const [activeCapaId, setActiveCapaId] = useState<string>(
    selectedId || capas[0]?.id || 'CAPA-2026-0038'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');

  const filteredCapas = capas.filter((c) => {
    const matchesPriority =
      filterPriority === 'all' || c.priority.toLowerCase() === filterPriority.toLowerCase();
    const matchesSearch =
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.problem.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.sourceRef && c.sourceRef.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesPriority && matchesSearch;
  });

  const currentCapa = capas.find((c) => c.id === activeCapaId) || filteredCapas[0] || capas[0];

  const handleToggleAction = (actionId: number) => {
    if (!currentCapa) return;
    const updatedActions = currentCapa.actions.map((a) =>
      a.id === actionId
        ? { ...a, status: (a.status === 'done' ? 'in_progress' : 'done') as 'pending' | 'in_progress' | 'done' }
        : a
    );
    const updatedCapa: CapaReport = {
      ...currentCapa,
      actions: updatedActions,
      history: [
        ...currentCapa.history,
        { event: `Action #${actionId} toggled status`, time: 'Just now' },
      ],
    };
    onUpdateCAPA(updatedCapa);
    showToast(`Action #${actionId} updated`);
  };

  const handleAdvanceStage = (nextStage: CapaReport['stage']) => {
    if (!currentCapa) return;
    const updatedCapa: CapaReport = {
      ...currentCapa,
      stage: nextStage,
      history: [
        ...currentCapa.history,
        { event: `CAPA advanced to stage ${nextStage.toUpperCase()}`, time: 'Just now' },
      ],
    };
    onUpdateCAPA(updatedCapa);
    showToast(`CAPA ${currentCapa.id} moved to stage: ${nextStage.toUpperCase()}`);
  };

  const handleOpenCreateDrawer = () => {
    let id = `CAPA-2026-00${45 + capas.length}`;
    let problem = '';
    let source = 'NCR';
    let sourceRef = 'NCR-2026-0114';
    let owner = 'Quality Assurance Lead';
    let priority: 'High' | 'Medium' | 'Low' = 'High';
    let dueDate = '25 Sep 2026';
    let containmentDesc = 'Immediate 100% sorting and quarantine hold on affected lot.';

    openDrawer(
      'Initiate 8D Corrective & Preventive Action (CAPA)',
      <div className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">CAPA ID</label>
            <input
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded bg-[#F6F4EF] font-mono"
              defaultValue={id}
              onChange={(e) => (id = e.target.value)}
            />
          </div>
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Trigger Source</label>
            <select
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded bg-white"
              defaultValue={source}
              onChange={(e) => (source = e.target.value)}
            >
              <option value="NCR">NCR (Non-Conformance Report)</option>
              <option value="Customer RMA">Customer RMA / Complaint</option>
              <option value="Internal Audit">ISO / IATF Internal Audit Finding</option>
              <option value="SPC Drift">In-Process SPC Control Breach</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Source Reference (NCR / Order #)</label>
            <input
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded font-mono"
              defaultValue={sourceRef}
              onChange={(e) => (sourceRef = e.target.value)}
            />
          </div>
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Target Close Date</label>
            <input
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded"
              defaultValue={dueDate}
              onChange={(e) => (dueDate = e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">8D Champion / Owner</label>
            <input
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded"
              defaultValue={owner}
              onChange={(e) => (owner = e.target.value)}
            />
          </div>
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Priority</label>
            <select
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded bg-white"
              defaultValue={priority}
              onChange={(e) => (priority = e.target.value as any)}
            >
              <option value="High">High (Major Spec / Customer Risk)</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-[#14213D] mb-1">D2: Problem Operational Statement</label>
          <textarea
            rows={3}
            className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded"
            placeholder="Detailed failure description, root suspected factors, and scope..."
            defaultValue={problem}
            onChange={(e) => (problem = e.target.value)}
          />
        </div>

        <div>
          <label className="block font-semibold text-[#14213D] mb-1">D3: Immediate Containment Action</label>
          <textarea
            rows={2}
            className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded"
            defaultValue={containmentDesc}
            onChange={(e) => (containmentDesc = e.target.value)}
          />
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
            const newCapa: CapaReport = {
              id: id || `CAPA-${Date.now()}`,
              source,
              sourceRef,
              type: 'Corrective',
              problem: problem || 'Dimensional tolerance non-conformance corrective action',
              owner,
              priority,
              dueDate,
              stage: 'contain',
              actions: [
                {
                  id: 1,
                  desc: containmentDesc,
                  owner: 'Quality Inspector',
                  due: 'Immediate',
                  status: 'done',
                  evidence: 'Quarantine hold sign-off',
                },
                {
                  id: 2,
                  desc: 'Execute 5-Why root cause drill-down with cross-functional engineering team',
                  owner,
                  due: 'Within 48 hours',
                  status: 'in_progress',
                  evidence: '',
                },
              ],
              effectiveness: {
                method: '10 consecutive production runs with 0 recurring defects',
                date: dueDate,
                result: null,
              },
              history: [{ event: `8D CAPA initiated from ${source} (${sourceRef})`, time: 'Today' }],
            };
            onCreateCAPA(newCapa);
            setActiveCapaId(newCapa.id);
            closeDrawer();
            showToast(`8D CAPA ${newCapa.id} initiated.`);
          }}
          className="px-4 py-1.5 text-xs font-semibold bg-[#14213D] text-white rounded hover:bg-[#1f3158]"
        >
          Open 8D CAPA
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-[#0F8B8D] font-bold">
            Quality Assurance &middot; 8D Problem Solving Methodology
          </div>
          <h1 className="text-2xl font-bold text-[#14213D] font-['Space_Grotesk']">
            Corrective &amp; Preventive Actions (8D CAPA)
          </h1>
          <p className="text-xs text-[#6B7280]">
            Systemic problem-solving framework with 8D stage gating, action verification, and long-term effectiveness auditing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreateDrawer}
            className="px-3.5 py-1.5 text-xs font-semibold bg-[#14213D] text-white rounded-lg hover:bg-[#1f3158] flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" /> + Initiate 8D CAPA
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
              placeholder="Search CAPA #, problem, owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#E4E0D6] rounded-lg focus:outline-none focus:border-[#0F8B8D]"
            />
          </div>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-semibold bg-[#F6F4EF] border border-[#E4E0D6] rounded-lg"
          >
            <option value="all">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>
        <div className="text-xs text-[#6B7280] font-mono">
          Showing <strong>{filteredCapas.length}</strong> active 8D initiatives
        </div>
      </div>

      {/* Main Split View: Left CAPA Cards & Right 8D Detailed Protocol */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: CAPA List */}
        <div className="lg:col-span-5 space-y-3">
          {filteredCapas.map((capa) => {
            const isSelected = capa.id === currentCapa?.id;
            const completedCount = capa.actions.filter((a) => a.status === 'done').length;

            return (
              <div
                key={capa.id}
                onClick={() => setActiveCapaId(capa.id)}
                className={`p-4 bg-white rounded-xl border transition-all cursor-pointer shadow-sm ${
                  isSelected
                    ? 'border-[#0F8B8D] ring-2 ring-[#0F8B8D]/15'
                    : 'border-[#E4E0D6] hover:border-[#0F8B8D]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[#0F8B8D]">{capa.id}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F6F4EF] text-[#6B7280]">
                      {capa.source}: {capa.sourceRef}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                      capa.priority === 'High'
                        ? 'bg-rose-100 text-rose-800'
                        : capa.priority === 'Medium'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {capa.priority}
                  </span>
                </div>

                <div className="font-bold text-xs text-[#14213D] mt-1.5 line-clamp-2">
                  {capa.problem}
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] text-[#6B7280] font-mono mb-1">
                    <span>Stage: <strong className="uppercase text-[#14213D]">{capa.stage}</strong></span>
                    <span>{completedCount}/{capa.actions.length} Actions</span>
                  </div>
                  <div className="w-full bg-[#F6F4EF] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#0F8B8D] h-full rounded-full transition-all"
                      style={{
                        width: `${(completedCount / Math.max(1, capa.actions.length)) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#6B7280] mt-3 pt-2 border-t border-[#E4E0D6]">
                  <span>Champion: <strong className="text-[#14213D]">{capa.owner}</strong></span>
                  <span className="text-amber-700 font-mono">Due: {capa.dueDate}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: 8D Stage Inspector */}
        <div className="lg:col-span-7">
          {currentCapa ? (
            <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm p-5 space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-[#E4E0D6] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#0F8B8D]">{currentCapa.id}</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#F6F4EF] text-[#14213D] font-bold">
                      Ref: {currentCapa.sourceRef}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                      Stage: {currentCapa.stage}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-[#14213D] mt-1 font-['Space_Grotesk']">
                    {currentCapa.problem}
                  </h2>
                  <p className="text-xs text-[#6B7280] font-mono mt-0.5">
                    Lead: <strong>{currentCapa.owner}</strong> &middot; Target Close: <strong>{currentCapa.dueDate}</strong>
                  </p>
                </div>
                <button
                  onClick={() => showToast(`Generated 8D Report PDF for ${currentCapa.id}`)}
                  className="p-2 text-[#6B7280] hover:text-[#14213D] border border-[#E4E0D6] rounded-lg hover:bg-[#F6F4EF]"
                  title="Print 8D Report"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>

              {/* 8D Stage Pipeline Visualizer */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#14213D] mb-2.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0F8B8D]" />
                  8-Discipline Stage Progress
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {EIGHT_D_STAGES.map((s) => {
                    const isCurrent = currentCapa.stage === s.key;
                    const stageOrder: CapaReport['stage'][] = ['define', 'contain', 'rootcause', 'action', 'implement', 'verify', 'close'];
                    const isPassed = stageOrder.indexOf(currentCapa.stage) > stageOrder.indexOf(s.key);

                    return (
                      <div
                        key={s.key}
                        onClick={() => handleAdvanceStage(s.key)}
                        className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                          isCurrent
                            ? 'bg-[#14213D] text-white border-[#14213D]'
                            : isPassed
                            ? 'bg-teal-50 border-teal-200 text-teal-900'
                            : 'bg-[#F6F4EF] border-[#E4E0D6] text-[#6B7280]'
                        }`}
                      >
                        <div className="text-[10px] font-bold uppercase">{s.key.toUpperCase()}</div>
                        <div className="text-xs font-semibold truncate">{s.label.split(':')[1]}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Plan & Corrective Steps Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#14213D] flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-[#0F8B8D]" />
                    D5 / D6: Action Plan &amp; Verification Evidence
                  </h3>
                  <span className="text-[11px] text-[#6B7280] font-mono">
                    {currentCapa.actions.length} Tasks Defined
                  </span>
                </div>

                <div className="space-y-2">
                  {currentCapa.actions.map((act) => (
                    <div
                      key={act.id}
                      className={`p-3 rounded-xl border flex items-start justify-between gap-3 transition-colors ${
                        act.status === 'done'
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-[#F6F4EF] border-[#E4E0D6]'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 flex-1">
                        <input
                          type="checkbox"
                          checked={act.status === 'done'}
                          onChange={() => handleToggleAction(act.id)}
                          className="mt-0.5 rounded text-[#0F8B8D] cursor-pointer"
                        />
                        <div className="space-y-0.5">
                          <div
                            className={`text-xs font-semibold ${
                              act.status === 'done' ? 'line-through text-[#6B7280]' : 'text-[#14213D]'
                            }`}
                          >
                            {act.desc}
                          </div>
                          <div className="text-[11px] text-[#6B7280] flex items-center gap-2">
                            <span>Owner: <strong>{act.owner}</strong></span>
                            <span>&middot;</span>
                            <span>Due: <strong className="font-mono">{act.due}</strong></span>
                            {act.evidence && (
                              <>
                                <span>&middot;</span>
                                <span className="text-emerald-700 font-medium">
                                  Evidence: {act.evidence}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                          act.status === 'done'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {act.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* D8: Effectiveness Verification & Sign-Off */}
              <div className="p-4 bg-[#F6F4EF] rounded-xl border border-[#E4E0D6] space-y-2 text-xs">
                <div className="font-bold text-[#14213D] flex items-center justify-between">
                  <span>D8: Effectiveness Audit Plan</span>
                  <span className="text-emerald-700 font-mono text-[11px]">Audit Target: {currentCapa.effectiveness.date}</span>
                </div>
                <p className="text-[#6B7280] leading-relaxed">
                  Method: {currentCapa.effectiveness.method}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#E4E0D6]">
                <button
                  onClick={() => {
                    const nextStage: CapaReport['stage'] =
                      currentCapa.stage === 'define'
                        ? 'contain'
                        : currentCapa.stage === 'contain'
                        ? 'rootcause'
                        : currentCapa.stage === 'rootcause'
                        ? 'action'
                        : currentCapa.stage === 'action'
                        ? 'implement'
                        : currentCapa.stage === 'implement'
                        ? 'verify'
                        : 'close';
                    handleAdvanceStage(nextStage);
                  }}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-bold bg-[#14213D] text-white rounded-lg hover:bg-[#1f3158] flex items-center justify-center gap-1.5"
                >
                  <ArrowRight className="w-3.5 h-3.5" /> Advance to Next 8D Stage
                </button>

                <button
                  onClick={() => {
                    handleAdvanceStage('close');
                    showToast(`CAPA ${currentCapa.id} formally signed off and closed by QA Lead.`);
                  }}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> D8 Formal QA Sign-Off &amp; Close
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#6B7280] bg-white rounded-xl border border-[#E4E0D6]">
              Select an 8D CAPA record from the left to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
