import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Filter,
  Search,
  Calendar,
  Layers,
  BarChart3,
  TrendingUp,
  FileText,
  Clock,
  Printer,
  Share2,
} from 'lucide-react';
import { mockScmReports } from '../../data/mockScmData';
import { SCMReportTemplate } from '../../types/scm';

interface ScmReportsViewProps {
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const ScmReportsView: React.FC<ScmReportsViewProps> = ({ onNavigate, showToast }) => {
  const [reports, setReports] = useState<SCMReportTemplate[]>(mockScmReports);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Demand Planning', 'Inventory & Warehouse', 'Procurement & Supply', 'Logistics & Distribution', 'Sustainability & ESG'];

  const filteredReports = reports.filter((r) => {
    const matchesCategory = activeCategory === 'All' || r.category === activeCategory;
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleGenerateReport = (report: SCMReportTemplate, format: 'PDF' | 'Excel' | 'CSV') => {
    showToast(`Generated & Exported "${report.title}" in ${format} format`);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono text-xs font-semibold uppercase">
              SCM Intelligence &amp; Analytics
            </span>
            <span className="text-xs text-slate-500">· 20+ Enterprise Reporting Templates</span>
          </div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D] mt-1">
            Supply Chain Management Reports &amp; Data Warehouse
          </h1>
          <p className="text-slate-500 text-xs">
            Generate scheduled and on-demand financial, operational, audit compliance, and logistics reports across all manufacturing nodes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('Configured Automated Weekly SCM Report Email Distribution')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Clock className="w-4 h-4 text-[#0F8B8D]" />
            <span>Schedule Automated Dispatch</span>
          </button>
        </div>
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                activeCategory === cat ? 'bg-[#14213D] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Report Template..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          />
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map((r) => (
          <div key={r.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono font-medium">
                  {r.category}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">ID: {r.id}</span>
              </div>
              <h3 className="font-bold text-sm text-[#14213D] font-['Space_Grotesk'] leading-snug">
                {r.title}
              </h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                {r.description}
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
              <div className="text-[11px] text-slate-400">
                Last Generated: <span className="font-mono text-slate-600">{r.lastGenerated}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {r.formats.map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => handleGenerateReport(r, fmt as any)}
                    className="flex-1 py-1.5 bg-slate-50 hover:bg-[#0F8B8D] hover:text-white text-slate-700 border border-slate-200 hover:border-[#0F8B8D] rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>{fmt}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
