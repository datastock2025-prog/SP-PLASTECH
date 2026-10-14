import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle,
  ShieldCheck,
  FileCheck,
  FileText,
  Truck,
  Scale,
  Clock,
  ArrowRight,
  Filter,
  Search,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { ComplianceExceptionRecord } from '../../types/salesOrderDeliveryTypes';

interface ComplianceExceptionsDashboardProps {
  exceptions: ComplianceExceptionRecord[];
  onResolveException: (id: string) => void;
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const ComplianceExceptionsDashboard: React.FC<ComplianceExceptionsDashboardProps> = ({
  exceptions,
  onResolveException,
  onNavigate,
  showToast,
}) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    'All',
    'E-Way Bill',
    'E-Invoice',
    'Gate & Security',
    'Delivery & POD',
    'Tax & GST',
  ];

  const filtered = exceptions.filter((x) => {
    if (activeCategory !== 'All' && x.category !== activeCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchDoc = x.documentNumber.toLowerCase().includes(q);
      const matchDesc = x.description.toLowerCase().includes(q);
      const matchEntity = x.entityName.toLowerCase().includes(q);
      if (!matchDoc && !matchDesc && !matchEntity) return false;
    }
    return true;
  });

  const criticalCount = exceptions.filter((x) => x.severity === 'Critical' && x.status === 'Open').length;
  const highCount = exceptions.filter((x) => x.severity === 'High' && x.status === 'Open').length;

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-red-100 text-red-700">
              <AlertOctagon className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-gray-900 font-['Space_Grotesk']">
              Statutory Compliance & Dispatch Exception Workbench
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Single pane of glass preventing GST tax penalties, road checkpost detentions, and vehicle gate-out lockouts.
          </p>
        </div>

        <button
          onClick={() => showToast('Compliance scan completed across 14 active dispatches. 3 exceptions active.')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5 text-gray-500" /> Run Full Audit Scan
        </button>
      </div>

      {/* Compliance Scorecard (Mandated 5 Core Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-gray-500">Overall Compliance Score</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">98.2%</div>
          <div className="text-[10px] text-emerald-600 font-semibold">&uarr; 0.4% from last audit</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-gray-500">EWB Compliance</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">99.1%</div>
          <div className="text-[10px] text-gray-400">Rule 138 compliant</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-gray-500">E-Invoice IRP Rate</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">99.8%</div>
          <div className="text-[10px] text-gray-400">IRN generated &lt;24h</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-gray-500">Gate Pass Audit</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">100%</div>
          <div className="text-[10px] text-gray-400">Zero unauthorized gate outs</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-amber-800">POD Collection Rate</div>
          <div className="text-2xl font-bold text-amber-800 mt-1">92.4%</div>
          <div className="text-[10px] text-amber-700 font-semibold">2 overdue collections</div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="bg-white p-1 rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-[#14213D] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search document #, description, customer, transporter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* Exceptions List */}
      <div className="space-y-3">
        {filtered.map((exc) => {
          const isCritical = exc.severity === 'Critical';
          const isHigh = exc.severity === 'High';

          return (
            <div
              key={exc.id}
              className={`p-4 rounded-xl border bg-white shadow-sm space-y-3 text-xs transition-all ${
                isCritical
                  ? 'border-red-300 ring-1 ring-red-200'
                  : isHigh
                  ? 'border-amber-300'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-gray-900">{exc.id}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isCritical
                        ? 'bg-red-100 text-red-800'
                        : isHigh
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {(exc.severity || 'WARNING').toUpperCase()}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700">
                    {exc.category}
                  </span>
                  <span className="text-gray-400">&bull;</span>
                  <span className="font-mono font-bold text-[#0F8B8D]">{exc.documentNumber}</span>
                </div>

                <div className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded self-start sm:self-auto">
                  {exc.penaltyRisk}
                </div>
              </div>

              <div className="text-gray-800 font-medium leading-relaxed">
                {exc.description}
              </div>

              <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                <div>
                  <span className="font-semibold text-gray-700">Recommended Resolution: </span>
                  <span className="text-gray-600">{exc.suggestedResolution}</span>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {exc.status === 'Open' ? (
                    <button
                      onClick={() => onResolveException(exc.id)}
                      className="px-3 py-1 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded font-semibold text-xs flex items-center gap-1 shadow-2xs"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Resolve Exception
                    </button>
                  ) : (
                    <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                      Resolved
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
