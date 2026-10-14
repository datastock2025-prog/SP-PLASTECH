import React, { useState } from 'react';
import { WorkOrder, MachineMaster, ItemMaster } from '../../types';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  X,
  Check,
  Download,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface ExcelImportProps {
  machines: MachineMaster[];
  items: ItemMaster[];
  onImportSuccess: (newOrders: WorkOrder[]) => void;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export const ExcelImportModal: React.FC<ExcelImportProps> = ({
  machines,
  items,
  onImportSuccess,
  onClose,
  showToast,
}) => {
  const [fileUploaded, setFileUploaded] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('Daily_Production_Schedule_Aug28.xlsx');
  const [selectedSheet, setSelectedSheet] = useState<string>('Shift_A_Schedule');
  const [matchRule, setMatchRule] = useState<'overwrite' | 'skip' | 'append'>('overwrite');

  // Mapping columns
  const [mappings, setMappings] = useState({
    woId: 'WO_Number',
    item: 'Product_Code',
    machine: 'Machine_Bay',
    shift: 'Shift_Name',
    qty: 'Planned_Quantity',
    operator: 'Operator_Assigned',
  });

  // Simulated validated rows
  const simulatedRows: {
    id: string;
    item: string;
    machine: string;
    shift: string;
    qty: number;
    operator: string;
    status: 'valid' | 'warning' | 'error';
    note?: string;
  }[] = [
    { id: 'WO-IMP-001', item: 'FG-CTN-500', machine: 'IMM-250T-03', shift: 'Shift A', qty: 5000, operator: 'R. Kumar', status: 'valid' },
    { id: 'WO-IMP-002', item: 'FG-HD-TUB-01', machine: 'IMM-450T-01', shift: 'Shift A', qty: 3200, operator: 'A. Sharma', status: 'valid' },
    { id: 'WO-IMP-003', item: 'FG-PET-030', machine: 'BLW-01', shift: 'Shift A', qty: 12000, operator: 'K. Iyer', status: 'valid' },
    { id: 'WO-IMP-004', item: 'RM-PP-NAT-001', machine: 'IMM-250T-03', shift: 'Shift B', qty: 1000, operator: 'S. Nair', status: 'warning', note: 'Item is marked Raw Material instead of FG' },
    { id: 'WO-IMP-005', item: 'FG-UNKNOWN', machine: 'IMM-999', shift: 'Shift C', qty: 0, operator: '—', status: 'error', note: 'Machine IMM-999 not registered in Master' },
  ];

  const handleSimulateUpload = () => {
    setFileUploaded(true);
    showToast('Excel file parsed: 5 rows detected in sheet "Shift_A_Schedule"');
  };

  const handleExecuteImport = () => {
    const validOrders: WorkOrder[] = simulatedRows
      .filter((r) => r.status !== 'error')
      .map((r, idx) => ({
        id: r.id,
        item: r.item === 'RM-PP-NAT-001' ? 'FG-CTN-500' : r.item,
        bomId: 'BOM-1042',
        machine: r.machine,
        day: 'Fri',
        qty: r.qty,
        uom: 'PCS',
        completed: 0,
        scrap: 0,
        status: 'planned',
        priority: 'Medium',
        dueDate: '2026-08-28',
        operator: r.operator,
        downtimeMin: 0,
        mold: 'MLD-1001',
        jitSeq: idx + 1,
        shift: r.shift,
        planDate: '2026-08-28',
        cycleTimeStd: 12.0,
        locInput: 'RM-WH-01',
        locOutput: 'FG-WH-01',
        outputLogs: [],
        downtimeLogs: [],
        checklist: [],
        history: [{ event: 'Imported from Excel file', time: 'Just now' }]
      }));

    onImportSuccess(validOrders);
    showToast(`Successfully imported ${validOrders.length} valid work orders from Excel.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-[#E4E0D6] max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-[#FAFAF8] border-b border-[#E4E0D6] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#14213D]">Excel / CSV Production Schedule Import</h2>
              <p className="text-xs text-[#6B7280]">Batch upload and mapping engine for daily master schedules</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200">
            <X className="w-5 h-5 text-[#6B7280]" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-5 text-xs">
          {!fileUploaded ? (
            /* Upload Zone */
            <div
              onClick={handleSimulateUpload}
              className="border-2 border-dashed border-[#0F8B8D] bg-teal-50/40 rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-teal-50 transition-colors"
            >
              <Upload className="w-10 h-10 text-[#0F8B8D] mb-3 animate-bounce" />
              <div className="text-sm font-bold text-[#14213D]">
                Drag and drop your Excel (.xlsx, .csv) production sheet here
              </div>
              <div className="text-xs text-[#6B7280] mt-1">
                Supports multiple sheets &bull; Click to load demo schedule template
              </div>
              <button
                type="button"
                className="mt-4 px-4 py-2 rounded-xl bg-[#0F8B8D] text-white font-bold text-xs"
              >
                Select Schedule File (.xlsx)
              </button>
            </div>
          ) : (
            /* Mapping & Preview Mode */
            <div className="space-y-4">
              {/* Sheet & Match Rule Selection */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-[#F6F4EF] border border-[#E4E0D6]">
                <div>
                  <label className="font-bold text-[#14213D] block mb-1">Select Excel Sheet</label>
                  <select
                    value={selectedSheet}
                    onChange={(e) => setSelectedSheet(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E4E0D6] bg-white font-semibold"
                  >
                    <option value="Shift_A_Schedule">Shift_A_Schedule (5 rows)</option>
                    <option value="Shift_B_Schedule">Shift_B_Schedule (8 rows)</option>
                    <option value="Full_Day_Master">Full_Day_Master (40 rows)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#14213D] block mb-1">Duplicate Handling Rule</label>
                  <select
                    value={matchRule}
                    onChange={(e) => setMatchRule(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-[#E4E0D6] bg-white font-semibold"
                  >
                    <option value="overwrite">Match by WO# &rarr; Overwrite Existing</option>
                    <option value="skip">Match by WO# &rarr; Skip Existing</option>
                    <option value="append">Always Append as New Sequence</option>
                  </select>
                </div>
              </div>

              {/* Validation Preview Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#14213D]">Data Validation &amp; Error Check</h4>
                  <span className="text-[11px] font-bold text-emerald-700">3 Valid &bull; 1 Warning &bull; 1 Error</span>
                </div>

                <div className="border border-[#E4E0D6] rounded-2xl overflow-hidden">
                  <table className="w-full text-xs border-collapse">
                    <thead className="bg-[#F6F4EF]">
                      <tr className="border-b border-[#E4E0D6] text-[#6B7280]">
                        <th className="p-2.5 text-left font-bold">WO #</th>
                        <th className="p-2.5 text-left font-bold">Product Item</th>
                        <th className="p-2.5 text-left font-bold">Machine</th>
                        <th className="p-2.5 text-left font-bold">Shift</th>
                        <th className="p-2.5 text-right font-bold">Qty</th>
                        <th className="p-2.5 text-left font-bold">Validation Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {simulatedRows.map((r, idx) => (
                        <tr key={idx} className="border-b border-[#E4E0D6]">
                          <td className="p-2.5 font-mono font-bold text-[#14213D]">{r.id}</td>
                          <td className="p-2.5 font-semibold text-[#14213D]">{r.item}</td>
                          <td className="p-2.5 font-mono">{r.machine}</td>
                          <td className="p-2.5">{r.shift}</td>
                          <td className="p-2.5 text-right font-mono font-bold">{r.qty.toLocaleString()}</td>
                          <td className="p-2.5">
                            {r.status === 'valid' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Valid
                              </span>
                            )}
                            {r.status === 'warning' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800" title={r.note}>
                                Warning: {r.note}
                              </span>
                            )}
                            {r.status === 'error' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800" title={r.note}>
                                Error: {r.note}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#FAFAF8] border-t border-[#E4E0D6] flex justify-between items-center">
          <button
            onClick={() => setFileUploaded(false)}
            className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-bold text-[#14213D]"
          >
            Reset Upload
          </button>

          {fileUploaded && (
            <button
              onClick={handleExecuteImport}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
            >
              <Check className="w-4 h-4" /> Import Valid Records (4 Orders)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
