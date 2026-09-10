import React, { useState } from 'react';
import { WorkOrder, ItemMaster } from '../../types';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Plus,
  BarChart2,
  Sliders,
  FileCheck,
  Activity
} from 'lucide-react';

interface QualityGateProps {
  workOrders: WorkOrder[];
  items: ItemMaster[];
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const QualityGateInspectionView: React.FC<QualityGateProps> = ({
  workOrders,
  items,
  onNavigate,
  showToast,
}) => {
  const [selectedWO, setSelectedWO] = useState<string>('WO-1188');
  const itemName = (code: string) => items.find((i) => i.code === code)?.name || code;

  const inspectionSamples = [
    { sample: 'Sample Shot #1 (08:00)', wallThickness: 1.22, weightG: 48.1, visualFlash: 'None', status: 'Passed' },
    { sample: 'Sample Shot #2 (09:00)', wallThickness: 1.24, weightG: 48.3, visualFlash: 'None', status: 'Passed' },
    { sample: 'Sample Shot #3 (10:00)', wallThickness: 1.25, weightG: 48.2, visualFlash: 'Minor Burr', status: 'Passed' },
    { sample: 'Sample Shot #4 (11:00)', wallThickness: 1.21, weightG: 47.9, visualFlash: 'None', status: 'Passed' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E4E0D6] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
              In-Line QA &bull; Statistical Process Control (SPC)
            </span>
            <span className="text-[11px] text-[#6B7280]">
              Hourly Dimensional Gates &bull; Auto-NCR Workflow
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#14213D]">Quality Gate Inspections &amp; SPC</h1>
        </div>

        <button
          onClick={() => showToast('Recorded 5-piece hourly sample in SPC database')}
          className="px-4 py-2.5 rounded-xl bg-[#0F8B8D] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-[#0c7072] transition-colors"
        >
          <Plus className="w-4 h-4" />
          + Log Hourly Gate Sample
        </button>
      </div>

      {/* Sampling Data Table & SPC Limits */}
      <div className="bg-white rounded-2xl border border-[#E4E0D6] p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D6]">
          <h3 className="font-bold text-sm text-[#14213D]">
            Hourly Inspection Log &mdash; WO-1188 ({itemName('FG-CTN-500')})
          </h3>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Process Cpk: 1.64 (In Control)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead className="bg-[#F6F4EF] text-[#6B7280]">
              <tr className="border-b border-[#E4E0D6]">
                <th className="p-3 text-left font-bold">Sampling Interval</th>
                <th className="p-3 text-center font-bold">Wall Thickness (Spec: 1.20±0.05 mm)</th>
                <th className="p-3 text-center font-bold">Weight (Spec: 48.0±1.0 g)</th>
                <th className="p-3 text-center font-bold">Visual Inspection</th>
                <th className="p-3 text-center font-bold">Gate Status</th>
              </tr>
            </thead>
            <tbody>
              {inspectionSamples.map((sample, idx) => (
                <tr key={idx} className="border-b border-[#E4E0D6] hover:bg-[#FAF9F5]">
                  <td className="p-3 font-semibold text-[#14213D]">{sample.sample}</td>
                  <td className="p-3 text-center font-mono font-bold text-[#14213D]">{sample.wallThickness} mm</td>
                  <td className="p-3 text-center font-mono font-bold text-[#14213D]">{sample.weightG} g</td>
                  <td className="p-3 text-center text-[#6B7280]">{sample.visualFlash}</td>
                  <td className="p-3 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {sample.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
