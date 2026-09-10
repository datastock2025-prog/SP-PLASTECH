import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Search,
  Filter,
  Plus,
  Send,
  ArrowRight,
  UserCheck,
  Building,
} from 'lucide-react';
import { mockScmExceptions } from '../../data/mockScmData';
import { SCMException } from '../../types/scm';

interface ScmExceptionsViewProps {
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const ScmExceptionsView: React.FC<ScmExceptionsViewProps> = ({ onNavigate, showToast }) => {
  const [exceptions, setExceptions] = useState<SCMException[]>(mockScmExceptions);
  const [selectedEx, setSelectedEx] = useState<SCMException | null>(mockScmExceptions[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');

  const handleAdvanceCapa = (exId: string) => {
    setExceptions((prev) =>
      prev.map((e) => {
        if (e.id === exId) {
          const nextStep =
            e.capaStep === '1. Identify & Contain'
              ? '2. Root Cause Analysis'
              : e.capaStep === '2. Root Cause Analysis'
              ? '3. Corrective Action'
              : e.capaStep === '3. Corrective Action'
              ? '4. Preventive Action'
              : e.capaStep === '4. Preventive Action'
              ? '5. Verification'
              : '6. Close & Standardize';
          const nextStatus = nextStep === '6. Close & Standardize' ? 'Resolved' : 'In Progress';
          return {
            ...e,
            capaStep: nextStep as any,
            status: nextStatus as any,
          };
        }
        return e;
      })
    );
    showToast(`Advanced CAPA Workflow for ${exId}`);
  };

  const filteredExceptions = exceptions.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSev = severityFilter === 'All' || e.severity === severityFilter;
    return matchesSearch && matchesSev;
  });

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-mono text-xs font-semibold uppercase">
              Exception Command Center
            </span>
            <span className="text-xs text-slate-500">· 6-Step CAPA Workflow Engine</span>
          </div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D] mt-1">
            Supply Chain Exceptions &amp; Incident Resolution
          </h1>
          <p className="text-slate-500 text-xs">
            Manage material stockouts, supplier delivery delays, mold maintenance breakdowns, and quality quarantine blocks through structured CAPA closure.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('Opened New Exception Incident Ticket Form')}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#E8622C] hover:bg-[#d45422] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Raise Incident Ticket</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Exceptions List & 6-Step CAPA Execution Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exception List (1.8 Cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              {['All', 'Critical', 'Major', 'Moderate'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    severityFilter === sev ? 'bg-[#14213D] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>

            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Exception..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredExceptions.map((ex) => (
              <div
                key={ex.id}
                onClick={() => setSelectedEx(ex)}
                className={`p-4 rounded-xl border transition cursor-pointer space-y-2 text-xs ${
                  selectedEx?.id === ex.id
                    ? 'border-[#0F8B8D] ring-2 ring-[#0F8B8D]/20 bg-[#0F8B8D]/5'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{ex.id}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-600 font-semibold">{ex.category}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ex.severity === 'Critical'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : ex.severity === 'Major'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {ex.severity}
                  </span>
                </div>

                <div className="font-bold text-sm text-slate-900">{ex.title}</div>
                <div className="text-slate-600 text-[11px] leading-relaxed">{ex.impact}</div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100/60 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <UserCheck className="w-3.5 h-3.5 text-[#0F8B8D]" />
                    <span>Owner: <strong>{ex.assignedTo}</strong></span>
                  </div>
                  <div className="font-mono text-slate-600">
                    Step: <strong className="text-[#0F8B8D]">{ex.capaStep}</strong>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ex.status === 'Resolved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {ex.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6-Step CAPA Command Visualizer (1.2 Cols) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[10px] font-mono text-[#0F8B8D] font-bold uppercase">
              CAPA Closed-Loop Workflow
            </span>
            <h3 className="font-bold text-base text-[#14213D] font-['Space_Grotesk'] mt-0.5">
              {selectedEx?.id}
            </h3>
            <p className="text-xs text-slate-500">{selectedEx?.title}</p>
          </div>

          {selectedEx && (
            <div className="space-y-4 text-xs">
              <div className="space-y-2">
                {[
                  '1. Identify & Contain',
                  '2. Root Cause Analysis',
                  '3. Corrective Action',
                  '4. Preventive Action',
                  '5. Verification',
                  '6. Close & Standardize',
                ].map((step, idx) => {
                  const currentIdx = [
                    '1. Identify & Contain',
                    '2. Root Cause Analysis',
                    '3. Corrective Action',
                    '4. Preventive Action',
                    '5. Verification',
                    '6. Close & Standardize',
                  ].indexOf(selectedEx.capaStep);

                  const isDone = idx < currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <div
                      key={step}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                        isDone
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950 font-medium'
                          : isCurrent
                          ? 'bg-[#0F8B8D]/10 border-[#0F8B8D] text-[#0F8B8D] font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isDone
                              ? 'bg-emerald-600 text-white'
                              : isCurrent
                              ? 'bg-[#0F8B8D] text-white'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {isDone ? '✓' : idx + 1}
                        </div>
                        <span>{step}</span>
                      </div>
                      <span className="text-[10px] font-mono">
                        {isDone ? 'Done' : isCurrent ? 'Active' : 'Pending'}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-[11px]">
                <div className="font-bold text-slate-800">Action in Progress:</div>
                <div className="text-slate-600">{selectedEx.actionTaken}</div>
              </div>

              {selectedEx.status !== 'Resolved' && (
                <button
                  onClick={() => handleAdvanceCapa(selectedEx.id)}
                  className="w-full py-2.5 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-xl font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Advance CAPA to Next Step</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
