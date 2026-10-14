import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Filter,
  BarChart2,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';

interface ReportsProps {
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const ProductionReportsHub: React.FC<ReportsProps> = ({
  onNavigate,
  showToast,
}) => {
  const reportsList = [
    { title: 'Daily Production Summary Report (DSR)', category: 'Operational', desc: 'Shift-wise output, scrap rate, machine utilization, and operator efficiency.', format: 'PDF / Excel' },
    { title: 'Shift Handover & OEE Analysis Log', category: 'Efficiency', desc: 'Detailed 3-factor OEE, downtime breakdown, and open issues for oncoming shift supervisor.', format: 'PDF / Print' },
    { title: 'Scrap & Regrind Waste Material Ledger', category: 'Sustainability', desc: 'Raw material vs regrind recycling diversion rates and resin loss accounting.', format: 'Excel / CSV' },
    { title: 'Lot Traceability & Electronic Batch Records', category: 'Compliance', desc: 'FDA 21 CFR Part 11 compliant audit pack with digital signatures and parameter history.', format: 'PDF Archive' },
    { title: 'Mold Tooling Maintenance & Shot Log', category: 'Toolroom', desc: 'Shot counts, cavity defect histories, and preventive maintenance due lists.', format: 'PDF / CSV' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E4E0D6] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#0F8B8D]/10 text-[#0F8B8D]">
              Business Intelligence &bull; MES Analytics
            </span>
            <span className="text-[11px] text-[#6B7280]">
              Operational, Compliance &amp; Sustainability Audits
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#14213D]">Production Reports Hub</h1>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportsList.map((rep, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-[#E4E0D6] p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#0F8B8D] transition-colors"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F6F4EF] text-[#4B5563]">
                  {rep.category}
                </span>
                <span className="text-[11px] text-[#6B7280] font-mono">{rep.format}</span>
              </div>
              <h3 className="font-bold text-sm text-[#14213D]">{rep.title}</h3>
              <p className="text-xs text-[#6B7280]">{rep.desc}</p>
            </div>

            <div className="flex gap-2 pt-2 border-t border-[#E4E0D6]">
              <button
                onClick={() => showToast(`Exported ${rep.title} (PDF)`)}
                className="flex-1 py-2 rounded-xl bg-[#0F8B8D] hover:bg-[#0c7072] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" /> Download Report
              </button>
              <button
                onClick={() => showToast(`Sent ${rep.title} to printer`)}
                className="px-3 py-2 rounded-xl bg-[#F6F4EF] hover:bg-[#FAF9F5] border border-[#E4E0D6] text-xs font-bold text-[#14213D]"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
