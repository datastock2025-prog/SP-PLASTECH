import React from 'react';
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  PieChart,
  Download,
  Calendar,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import { ExtendedPurchaseOrder, SupplierMaster } from '../../types/procurement';

interface Props {
  pos: ExtendedPurchaseOrder[];
  suppliers: SupplierMaster[];
  showToast: (msg: string) => void;
}

export const ProcurementReportsAnalyticsView: React.FC<Props> = ({
  pos,
  suppliers,
  showToast,
}) => {
  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
            Procurement Analytics & Financial Spend Reports
          </h1>
          <p className="text-xs text-slate-500">
            Spend analysis by resin category, Purchase Price Variance (PPV) metrics, and uninvoiced GRN liabilities
          </p>
        </div>

        <button
          onClick={() => showToast('Exporting comprehensive procurement audit report to Excel...')}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#14213D] hover:bg-[#1f325c] text-white rounded-lg text-xs font-semibold shadow-sm transition"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" /> Export BI Report
        </button>
      </div>

      {/* 4 Core Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="text-slate-500">YTD Polymer Spend</div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-[#14213D]">₹88.45 Lakhs</div>
          <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingDown className="w-3 h-3" /> 4.2% below annual budgeted cost
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="text-slate-500">Net Favorable PPV Variance</div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-emerald-700">-₹2.15 Lakhs</div>
          <div className="text-[10px] text-slate-400">Achieved via volume aggregation</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="text-slate-500">Uninvoiced GRN Accruals</div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-amber-600">₹7.85 Lakhs</div>
          <div className="text-[10px] text-slate-400">Material received, awaiting vendor bills</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="text-slate-500">Average Supplier Lead Time</div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-[#14213D]">5.2 Days</div>
          <div className="text-[10px] text-emerald-600 font-semibold">0.8 days faster than industry benchmark</div>
        </div>
      </div>

      {/* Category Spend Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 text-xs">
          <h3 className="font-bold text-sm text-[#14213D]">Raw Material Spend Distribution by Resin Family</h3>
          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Polypropylene (PP Copolymer & Homopolymer)</span>
                <span>₹52.1 Lakhs (59%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-[#0F8B8D] h-full rounded-full" style={{ width: '59%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Polyethylene (HDPE Blow/Injection Grades)</span>
                <span>₹19.4 Lakhs (22%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-teal-600 h-full rounded-full" style={{ width: '22%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Engineering Plastics (Nylon 66, POM Delrin, Polycarbonate)</span>
                <span>₹11.2 Lakhs (13%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-[#14213D] h-full rounded-full" style={{ width: '13%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Color Masterbatches & UV Additives</span>
                <span>₹5.75 Lakhs (6%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-[#E8622C] h-full rounded-full" style={{ width: '6%' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 text-xs">
          <h3 className="font-bold text-sm text-[#14213D]">Top 5 Suppliers by Procurement Volume (Pareto 80/20)</h3>
          <div className="space-y-2.5">
            {suppliers.map((sup, idx) => (
              <div key={sup.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#14213D] text-white text-[10px] font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-bold text-[#14213D]">{sup.name}</div>
                    <div className="text-[10px] text-slate-500">{sup.category}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[#14213D]">₹{(sup.totalSpendYtd / 100000).toFixed(2)} Lakhs</div>
                  <div className="text-[10px] text-emerald-600 font-semibold">{sup.scorecard.overallGrade} Grade ({sup.scorecard.overallScore}/100)</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
