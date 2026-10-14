import React, { useState, useMemo } from 'react';
import {
  Target,
  Plus,
  Search,
  Filter,
  Layers,
  Calendar,
  DollarSign,
  TrendingUp,
  Award,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Clock,
  FlaskConical,
  FileText,
  AlertTriangle,
  MoveRight,
  CheckCircle2,
  XCircle,
  Building2,
  User,
} from 'lucide-react';
import { Opportunity, OpportunityStage, ProductInterestType } from '../../types/crm';
import { mockOpportunities } from '../../data/mockCrmData';

interface CrmOpportunityPipelineViewProps {
  onNavigate: (view: string, params?: any) => void;
  showToast: (message: string) => void;
  initialFilter?: string;
}

const STAGES: OpportunityStage[] = [
  'Qualification',
  'Requirement Identified',
  'Technical Discussion',
  'Sample Submitted',
  'Quotation Sent',
  'Negotiation',
  'Customer Review',
  'Won',
  'Lost',
  'On Hold',
];

export const CrmOpportunityPipelineView: React.FC<CrmOpportunityPipelineViewProps> = ({
  onNavigate,
  showToast,
  initialFilter,
}) => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(mockOpportunities);
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'funnel' | 'calendar'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [salespersonFilter, setSalespersonFilter] = useState('All');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');
  const [draggedOppId, setDraggedOppId] = useState<string | null>(null);

  // Pipeline KPIs
  const openOpps = opportunities.filter(o => o.status === 'Open');
  const totalPipelineValue = openOpps.reduce((acc, curr) => acc + curr.expectedValue, 0);
  const weightedPipelineValue = openOpps.reduce((acc, curr) => acc + (curr.expectedValue * curr.winProbability) / 100, 0);
  const closingThisMonth = opportunities.filter(o => o.expectedCloseDate.startsWith('2026-09')).length;
  const avgDealSize = openOpps.length > 0 ? totalPipelineValue / openOpps.length : 0;
  const wonCount = opportunities.filter(o => o.status === 'Won').length;
  const closedCount = wonCount + opportunities.filter(o => o.status === 'Lost').length;
  const winRatePct = closedCount > 0 ? ((wonCount / closedCount) * 100).toFixed(1) : '0';

  const formatCurrency = (val: number) => `₹${(val / 100000).toFixed(1)}L`;

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(opp => {
      if (initialFilter === 'Won' && opp.status !== 'Won') return false;
      if (salespersonFilter !== 'All' && opp.salesperson !== salespersonFilter) return false;
      if (productCategoryFilter !== 'All' && opp.productCategory !== productCategoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          opp.opportunityName.toLowerCase().includes(q) ||
          opp.accountName.toLowerCase().includes(q) ||
          opp.salesperson.toLowerCase().includes(q) ||
          opp.productCategory.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [opportunities, initialFilter, salespersonFilter, productCategoryFilter, searchQuery]);

  const handleStageMove = (oppId: string, newStage: OpportunityStage) => {
    setOpportunities(prev =>
      prev.map(opp => {
        if (opp.id === oppId) {
          const status = newStage === 'Won' ? 'Won' : newStage === 'Lost' ? 'Lost' : newStage === 'On Hold' ? 'On Hold' : 'Open';
          const winProbability = newStage === 'Won' ? 100 : newStage === 'Lost' ? 0 : newStage === 'Negotiation' ? 85 : opp.winProbability;
          return { ...opp, stage: newStage, status, winProbability };
        }
        return opp;
      })
    );
    showToast(`Opportunity moved to ${newStage}`);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Commercial Deal Pipeline
            </span>
            <span className="text-xs text-slate-500">{filteredOpportunities.length} Active Deals</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Opportunity Pipeline & Kanban</h1>
          <p className="text-sm text-slate-600">
            Manage stage progression from polymer qualification to technical mold trial, quotation, and contract award.
          </p>
        </div>

        {/* View Switcher & Action */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'}`}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'}`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('funnel')}
              className={`px-3 py-1.5 rounded-md transition-colors ${viewMode === 'funnel' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'}`}
            >
              Funnel
            </button>
          </div>

          <button
            onClick={() => onNavigate('crmOpportunityDetail', { isNew: true })}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Opportunity
          </button>
        </div>
      </div>

      {/* Pipeline Summary KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500">Total Pipeline</span>
          <div className="text-lg font-bold text-slate-900 mt-0.5">{formatCurrency(totalPipelineValue)}</div>
          <span className="text-[10px] text-indigo-600">{openOpps.length} open deals</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500">Weighted Pipeline</span>
          <div className="text-lg font-bold text-indigo-700 mt-0.5">{formatCurrency(weightedPipelineValue)}</div>
          <span className="text-[10px] text-slate-500">Probability weighted</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500">Closing This Month</span>
          <div className="text-lg font-bold text-emerald-700 mt-0.5">{closingThisMonth} Deals</div>
          <span className="text-[10px] text-slate-500">Target Sept 2026</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500">Average Deal Size</span>
          <div className="text-lg font-bold text-slate-900 mt-0.5">{formatCurrency(avgDealSize)}</div>
          <span className="text-[10px] text-slate-500">Per opportunity</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500">Win Rate</span>
          <div className="text-lg font-bold text-emerald-600 mt-0.5">{winRatePct}%</div>
          <span className="text-[10px] text-emerald-700">{wonCount} won of {closedCount} closed</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500">Avg Stage Age</span>
          <div className="text-lg font-bold text-amber-700 mt-0.5">14.2 Days</div>
          <span className="text-[10px] text-slate-500">Velocity index</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search deal name, customer, polymer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={salespersonFilter}
            onChange={(e) => setSalespersonFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Sales Owners</option>
            <option value="Rajesh Sharma">Rajesh Sharma</option>
            <option value="Pooja Nair">Pooja Nair</option>
            <option value="Amit Verma">Amit Verma</option>
          </select>

          <select
            value={productCategoryFilter}
            onChange={(e) => setProductCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Product Lines</option>
            <option value="Custom Injection Molded Part">Custom Molded Part</option>
            <option value="Color Masterbatch">Color Masterbatch</option>
            <option value="Finished Plastic Product">Finished Product</option>
            <option value="Blow Molded Container">Blow Molded Container</option>
          </select>
        </div>
      </div>

      {/* View Mode: Kanban */}
      {viewMode === 'kanban' && (
        <div className="flex gap-3 overflow-x-auto pb-4 min-h-[580px]">
          {STAGES.map(stage => {
            const stageOpps = filteredOpportunities.filter(o => o.stage === stage);
            const stageTotal = stageOpps.reduce((acc, curr) => acc + curr.expectedValue, 0);

            return (
              <div
                key={stage}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedOppId) {
                    handleStageMove(draggedOppId, stage);
                    setDraggedOppId(null);
                  }
                }}
                className="w-72 shrink-0 bg-slate-50/80 rounded-xl border border-slate-200 flex flex-col max-h-[700px]"
              >
                {/* Column Header */}
                <div className="p-3 border-b border-slate-200 bg-white/70 rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800 truncate" title={stage}>{stage}</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                      {stageOpps.length}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 font-semibold">
                    {formatCurrency(stageTotal)}
                  </div>
                </div>

                {/* Column Card List */}
                <div className="p-2.5 space-y-2.5 overflow-y-auto flex-1">
                  {stageOpps.map(opp => (
                    <div
                      key={opp.id}
                      draggable
                      onDragStart={() => setDraggedOppId(opp.id)}
                      onClick={() => onNavigate('crmOpportunityDetail', { oppId: opp.id })}
                      className="bg-white p-3 rounded-lg border border-slate-200 hover:border-indigo-500 shadow-2xs hover:shadow-xs transition-all cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="font-bold text-xs text-slate-900 group-hover:text-indigo-700 line-clamp-2">
                          {opp.opportunityName}
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                          opp.priority === 'Critical' ? 'bg-rose-100 text-rose-800' :
                          opp.priority === 'High' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {opp.priority}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600 font-medium flex items-center gap-1.5">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span className="truncate">{opp.accountName}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-semibold">
                        <span className="text-teal-700">{formatCurrency(opp.expectedValue)}</span>
                        <span className="text-slate-500 text-[10px] font-normal">
                          Win: <strong className="text-indigo-700">{opp.winProbability}%</strong>
                        </span>
                      </div>

                      <div className="p-1.5 bg-slate-50 rounded text-[10px] text-slate-600 space-y-0.5">
                        <div>Part: <span className="font-mono font-medium text-slate-800">{opp.customerPartNumber || 'N/A'}</span></div>
                        <div className="truncate">Grade: {opp.polymerGrade || opp.productCategory}</div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {opp.salesperson.split(' ')[0]}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {opp.stageAgeDays}d in stage
                        </span>
                      </div>

                      {/* Quick Move Stage dropdown */}
                      <div className="pt-1 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={opp.stage}
                          onChange={(e) => handleStageMove(opp.id, e.target.value as OpportunityStage)}
                          className="w-full text-[10px] py-1 px-1 bg-slate-50 border border-slate-200 rounded text-slate-700"
                        >
                          {STAGES.map(st => (
                            <option key={st} value={st}>Move to: {st}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}

                  {stageOpps.length === 0 && (
                    <div className="p-4 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
                      No deals in {stage}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Mode: List Table */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="p-3">Opportunity</th>
                  <th className="p-3">Account</th>
                  <th className="p-3">Stage</th>
                  <th className="p-3">Exp. Value</th>
                  <th className="p-3">Win %</th>
                  <th className="p-3">Target Close</th>
                  <th className="p-3">Sales Owner</th>
                  <th className="p-3">Next Action</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredOpportunities.map(opp => (
                  <tr
                    key={opp.id}
                    onClick={() => onNavigate('crmOpportunityDetail', { oppId: opp.id })}
                    className="hover:bg-indigo-50/30 transition-colors cursor-pointer"
                  >
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{opp.opportunityName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{opp.id} • {opp.productCategory}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-slate-800">{opp.accountName}</div>
                      <div className="text-[10px] text-slate-500">{opp.contactPerson}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {opp.stage}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-teal-800">{formatCurrency(opp.expectedValue)}</td>
                    <td className="p-3 font-bold text-indigo-700">{opp.winProbability}%</td>
                    <td className="p-3 text-slate-700">{opp.expectedCloseDate}</td>
                    <td className="p-3 text-slate-800">{opp.salesperson}</td>
                    <td className="p-3 text-slate-600 text-[11px] max-w-xs truncate">{opp.nextActivity || 'No pending activity'}</td>
                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onNavigate('crmOpportunityDetail', { oppId: opp.id })}
                        className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-semibold rounded text-[11px] hover:bg-indigo-100"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Mode: Funnel Overview */}
      {viewMode === 'funnel' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">Conversion Funnel Progression</h2>
          <div className="space-y-3">
            {STAGES.slice(0, 7).map((st, idx) => {
              const count = opportunities.filter(o => o.stage === st).length;
              const val = opportunities.filter(o => o.stage === st).reduce((a, c) => a + c.expectedValue, 0);
              const widthPct = Math.max(15, 100 - idx * 12);

              return (
                <div key={st} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800">{st}</span>
                    <span className="text-slate-600">{count} Deals ({formatCurrency(val)})</span>
                  </div>
                  <div className="h-5 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-teal-500 rounded-full transition-all flex items-center justify-end pr-2 text-[10px] text-white font-bold"
                      style={{ width: `${widthPct}%` }}
                    >
                      {count > 0 && `${count} Deals`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
