import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { WorkOrder, MachineMaster, ItemMaster, RejectionBreakdownItem, DowntimeIntervalItem } from '../../types';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  Check,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Clock,
  Layers,
  FileText
} from 'lucide-react';
import { STANDARD_REJECTION_REASONS } from './MultiRejectionModal';
import { STANDARD_DOWNTIME_REASONS, calculateMinutesBetween } from './MultiDowntimeModal';

export interface DailyProductionExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrders: WorkOrder[];
  machines: MachineMaster[];
  items: ItemMaster[];
  onImportProductionData: (importedRows: Partial<WorkOrder>[], mode: 'update' | 'append') => void;
  showToast: (msg: string) => void;
}

export interface ParsedProductionRow {
  id: string;
  item: string;
  machine: string;
  shift: string;
  qty: number;
  completed: number;
  scrap: number;
  runnerKg: number;
  lumpsKg: number;
  downtimeMin: number;
  rejectionBreakdown: RejectionBreakdownItem[];
  downtimeIntervals: DowntimeIntervalItem[];
  operator: string;
  status: WorkOrder['status'];
  remark?: string;
  validationStatus: 'valid' | 'warning' | 'new';
  validationMessage?: string;
}

export const DailyProductionExcelModal: React.FC<DailyProductionExcelModalProps> = ({
  isOpen,
  onClose,
  workOrders,
  machines,
  items,
  onImportProductionData,
  showToast,
}) => {
  if (!isOpen) return null;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedProductionRow[]>([]);
  const [importMode, setImportMode] = useState<'update' | 'append'>('update');
  const [activeTab, setActiveTab] = useState<'upload' | 'preview'>('upload');

  // Parse formatted string of rejection reasons: e.g. "Short Shot:15; Flash:5; Moisture Splay:3"
  const parseRejectionString = (rawStr: any, fallbackScrap: number): RejectionBreakdownItem[] => {
    if (!rawStr) {
      if (fallbackScrap > 0) {
        return [{ reason: STANDARD_REJECTION_REASONS[0].reason, qty: fallbackScrap, category: 'process' }];
      }
      return [];
    }

    const str = String(rawStr);
    const parts = str.split(/[;|]/);
    const items: RejectionBreakdownItem[] = [];

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const colonIdx = trimmed.lastIndexOf(':');
      if (colonIdx !== -1) {
        const reasonPart = trimmed.substring(0, colonIdx).trim();
        const qtyPart = parseInt(trimmed.substring(colonIdx + 1).trim()) || 0;
        items.push({
          id: `rej-${Date.now()}-${items.length}`,
          reason: reasonPart || 'Short Shot / Incomplete Cavity Filling',
          qty: qtyPart,
          category: 'process',
        });
      } else {
        items.push({
          id: `rej-${Date.now()}-${items.length}`,
          reason: trimmed,
          qty: fallbackScrap || 5,
          category: 'process',
        });
      }
    }

    return items.length > 0
      ? items
      : fallbackScrap > 0
      ? [{ reason: STANDARD_REJECTION_REASONS[0].reason, qty: fallbackScrap, category: 'process' }]
      : [];
  };

  // Parse formatted string of downtime intervals: e.g. "08:00-08:30:Mold Setup; 10:15-10:45:Purging"
  const parseDowntimeString = (rawStr: any, fallbackMin: number): DowntimeIntervalItem[] => {
    if (!rawStr) {
      if (fallbackMin > 0) {
        return [
          {
            fromTime: '08:00',
            toTime: '08:30',
            min: fallbackMin,
            reason: STANDARD_DOWNTIME_REASONS[0].reason,
            category: 'Setup / Tooling',
          },
        ];
      }
      return [];
    }

    const str = String(rawStr);
    const parts = str.split(/[;|]/);
    const intervals: DowntimeIntervalItem[] = [];

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      // Pattern: HH:MM-HH:MM:Reason or HH:MM - HH:MM : Reason
      const timeMatch = trimmed.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})(?:\s*:\s*(.+))?/);
      if (timeMatch) {
        const fromTime = timeMatch[1];
        const toTime = timeMatch[2];
        const reason = timeMatch[3] ? timeMatch[3].trim() : STANDARD_DOWNTIME_REASONS[0].reason;
        const dur = calculateMinutesBetween(fromTime, toTime);
        intervals.push({
          id: `dwn-${Date.now()}-${intervals.length}`,
          fromTime,
          toTime,
          min: dur > 0 ? dur : 30,
          reason,
          category: 'Mechanical',
        });
      } else {
        // Just text reason
        intervals.push({
          id: `dwn-${Date.now()}-${intervals.length}`,
          fromTime: '08:00',
          toTime: '08:30',
          min: fallbackMin || 30,
          reason: trimmed,
          category: 'Setup / Tooling',
        });
      }
    }

    return intervals.length > 0
      ? intervals
      : fallbackMin > 0
      ? [
          {
            fromTime: '08:00',
            toTime: '08:30',
            min: fallbackMin,
            reason: STANDARD_DOWNTIME_REASONS[0].reason,
            category: 'Setup / Tooling',
          },
        ]
      : [];
  };

  const processJsonRows = (rawRows: any[]) => {
    const parsed: ParsedProductionRow[] = rawRows.map((row: any, idx: number) => {
      // Support various header naming conventions
      const woId = String(row['WO_Number'] || row['WO Number'] || row['Work Order'] || row['WO_ID'] || row['WO#'] || row['id'] || `WO-DAILY-${idx + 1}`).trim();
      const itemCode = String(row['Item_Code'] || row['Item Code'] || row['Item'] || row['Product_Code'] || row['Product'] || '').trim();
      const machineBay = String(row['Machine_Bay'] || row['Machine Bay'] || row['Machine'] || row['Bay'] || '').trim();
      const shift = String(row['Shift'] || row['Shift_Name'] || 'Shift A').trim();
      const plannedQty = Number(row['Planned_Qty'] || row['Planned Qty'] || row['Planned'] || row['qty'] || 1000);
      const goodQty = Number(row['Actual_Good'] || row['Actual Good'] || row['Good_Qty'] || row['Good'] || row['completed'] || 0);
      const scrapQty = Number(row['Scrap_Qty'] || row['Scrap Qty'] || row['Scrap'] || row['Rejection_Qty'] || row['rejection'] || 0);
      const runnerKg = Number(row['Runner_Kg'] || row['Runner (kg)'] || row['Runner Kg'] || row['Runner'] || row['runnerQty'] || row['runnerWeightKg'] || 0);
      const lumpsKg = Number(row['Lumps_Kg'] || row['Lumps (kg)'] || row['Lumps Kg'] || row['Lumbes_Qty'] || row['Lumps'] || row['lumbesQty'] || row['lumpsWeightKg'] || 0);
      const downtimeMin = Number(row['Downtime_Min'] || row['Downtime (min)'] || row['Downtime Min'] || row['Downtime'] || 0);
      const operator = String(row['Operator'] || row['Lead_Operator'] || row['Technician'] || 'Operator').trim();
      const statusRaw = String(row['Status'] || 'in_progress').toLowerCase().trim();
      const remark = String(row['Remarks'] || row['Notes'] || '').trim();

      // Parse rejections and downtime
      const rejStr = row['Rejection_Breakdown'] || row['Rejection Reasons'] || row['Rejections'] || row['rejectionReason'];
      const rejections = parseRejectionString(rejStr, scrapQty);

      const dwnStr = row['Downtime_Intervals'] || row['Downtime Logs'] || row['Downtime_Log'] || row['Downtimes'];
      const downtimes = parseDowntimeString(dwnStr, downtimeMin);

      // Recalculate total scrap & total downtime from intervals if they yielded greater precision
      const computedScrap = rejections.length > 0 ? rejections.reduce((s, r) => s + r.qty, 0) : scrapQty;
      const computedDowntime = downtimes.length > 0 ? downtimes.reduce((s, d) => s + d.min, 0) : downtimeMin;

      // Validation
      const existingWO = workOrders.find((w) => w.id.toLowerCase() === woId.toLowerCase());
      let validationStatus: 'valid' | 'warning' | 'new' = 'valid';
      let validationMessage = 'Ready to sync';

      if (!existingWO) {
        validationStatus = 'new';
        validationMessage = 'New Work Order (will append)';
      } else if (goodQty + computedScrap > plannedQty * 1.5) {
        validationStatus = 'warning';
        validationMessage = 'Output exceeds planned by >50%';
      }

      const validStatusValues: WorkOrder['status'][] = [
        'planned',
        'released',
        'in_progress',
        'paused',
        'quality_hold',
        'completed',
      ];
      const finalStatus: WorkOrder['status'] = validStatusValues.includes(statusRaw as any)
        ? (statusRaw as any)
        : 'in_progress';

      return {
        id: woId,
        item: itemCode || (existingWO ? existingWO.item : 'FG-CTN-500'),
        machine: machineBay || (existingWO ? existingWO.machine || '' : 'IMM-250T-03'),
        shift: shift || 'Shift A',
        qty: plannedQty,
        completed: goodQty,
        scrap: computedScrap,
        runnerKg,
        lumpsKg,
        downtimeMin: computedDowntime,
        rejectionBreakdown: rejections,
        downtimeIntervals: downtimes,
        operator,
        status: finalStatus,
        remark,
        validationStatus,
        validationMessage,
      };
    });

    setParsedRows(parsed);
    setActiveTab('preview');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readUploadedFile(file);
  };

  const readUploadedFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();

    if (file.name.endsWith('.csv')) {
      reader.onload = (e) => {
        const text = e.target?.result as string;
        try {
          const workbook = XLSX.read(text, { type: 'string' });
          const firstSheet = workbook.SheetNames[0];
          const json = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);
          processJsonRows(json);
          showToast(`Loaded ${json.length} production records from ${file.name}`);
        } catch (err) {
          showToast('Error reading CSV file format');
        }
      };
      reader.readAsText(file);
    } else {
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.SheetNames[0];
          const json = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);
          processJsonRows(json);
          showToast(`Parsed Excel workbook: ${json.length} daily logs found in sheet "${firstSheet}"`);
        } catch (err) {
          showToast('Failed to parse Excel workbook. Please verify file format.');
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Download real sample Excel/CSV template
  const handleDownloadTemplate = (format: 'xlsx' | 'csv') => {
    const sampleData = [
      {
        WO_Number: 'WO-1001',
        Item_Code: 'FG-CTN-500',
        Machine_Bay: 'IMM-250T-03',
        Shift: 'Shift A',
        Planned_Qty: 5000,
        Actual_Good: 4850,
        Scrap_Qty: 45,
        Rejection_Breakdown: 'Short Shot:25; Part Flash:15; Silver Streaks:5',
        Downtime_Min: 65,
        Downtime_Intervals: '08:00-08:45:Mold Setup; 11:15-11:35:Barrel Purging',
        Runner_Kg: 18.5,
        Lumps_Kg: 4.2,
        Operator: 'R. Kumar',
        Status: 'completed',
        Remarks: 'Smooth run, minor heater fluctuation zone 2',
      },
      {
        WO_Number: 'WO-1002',
        Item_Code: 'FG-HD-TUB-01',
        Machine_Bay: 'IMM-450T-01',
        Shift: 'Shift A',
        Planned_Qty: 3200,
        Actual_Good: 3100,
        Scrap_Qty: 30,
        Rejection_Breakdown: 'Sink Marks:20; Black Specks:10',
        Downtime_Min: 40,
        Downtime_Intervals: '09:30-10:10:Robot Arm Alarm',
        Runner_Kg: 12.0,
        Lumps_Kg: 2.8,
        Operator: 'A. Sharma',
        Status: 'completed',
        Remarks: 'Verified hold pressure with QC inspector',
      },
      {
        WO_Number: 'WO-1003',
        Item_Code: 'FG-PET-030',
        Machine_Bay: 'BLW-01',
        Shift: 'Shift B',
        Planned_Qty: 12000,
        Actual_Good: 11400,
        Scrap_Qty: 80,
        Rejection_Breakdown: 'Startup Stabilization Shots:50; Dimensional Warpage:30',
        Downtime_Min: 50,
        Downtime_Intervals: '14:00-14:35:Mold Changeover; 17:00-17:15:Hopper Refill',
        Runner_Kg: 24.5,
        Lumps_Kg: 6.0,
        Operator: 'K. Iyer',
        Status: 'in_progress',
        Remarks: 'Shift B ongoing production run',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily_Production');

    if (format === 'xlsx') {
      XLSX.writeFile(workbook, 'Daily_Production_Template.xlsx');
      showToast('Downloaded Daily_Production_Template.xlsx');
    } else {
      XLSX.writeFile(workbook, 'Daily_Production_Template.csv');
      showToast('Downloaded Daily_Production_Template.csv');
    }
  };

  // 1-Click Load Realistic Demo Daily Production Sheet
  const handleLoadSampleDemo = () => {
    setFileName('Demo_Daily_Production_Shift_Report.xlsx');
    const demoData = [
      {
        WO_Number: workOrders[0]?.id || 'WO-1001',
        Item_Code: workOrders[0]?.item || 'FG-CTN-500',
        Machine_Bay: workOrders[0]?.machine || 'IMM-250T-03',
        Shift: 'Shift A',
        Planned_Qty: workOrders[0]?.qty || 5000,
        Actual_Good: 4820,
        Scrap_Qty: 55,
        Rejection_Breakdown: 'Short Shot / Incomplete Cavity Filling:30; Part Flash / Parting Line Burrs:15; Silver Streaks / Moisture Splay:10',
        Downtime_Min: 70,
        Downtime_Intervals: '08:00-08:45:Mold Changeover (SMED); 11:00-11:25:Barrel Purging & Color Cleanout',
        Runner_Kg: 22.4,
        Lumps_Kg: 5.1,
        Operator: 'R. Kumar',
        Status: 'completed',
        Remarks: 'First piece approved by Quality Gate at 08:48',
      },
      {
        WO_Number: workOrders[1]?.id || 'WO-1002',
        Item_Code: workOrders[1]?.item || 'FG-HD-TUB-01',
        Machine_Bay: workOrders[1]?.machine || 'IMM-450T-01',
        Shift: 'Shift A',
        Planned_Qty: workOrders[1]?.qty || 3200,
        Actual_Good: 3080,
        Scrap_Qty: 32,
        Rejection_Breakdown: 'Sink Marks & Thick Section Voids:20; Degraded Polymer & Black Specks:12',
        Downtime_Min: 45,
        Downtime_Intervals: '09:15-10:00:Take-out Robot Arm Vacuum Alarm',
        Runner_Kg: 14.8,
        Lumps_Kg: 3.2,
        Operator: 'A. Sharma',
        Status: 'completed',
        Remarks: 'Suction cup cleaned, resumed cycle time 14.2s',
      },
      {
        WO_Number: workOrders[2]?.id || 'WO-1003',
        Item_Code: workOrders[2]?.item || 'FG-PET-030',
        Machine_Bay: workOrders[2]?.machine || 'BLW-01',
        Shift: 'Shift B',
        Planned_Qty: workOrders[2]?.qty || 12000,
        Actual_Good: 11650,
        Scrap_Qty: 95,
        Rejection_Breakdown: 'Start-up Purge & Stabilization Shots:60; Dimensional Warpage & Twisting:35',
        Downtime_Min: 55,
        Downtime_Intervals: '14:15-14:50:Mold SMED; 17:30-17:50:Resin Hopper Empty',
        Runner_Kg: 31.0,
        Lumps_Kg: 7.4,
        Operator: 'K. Iyer',
        Status: 'in_progress',
        Remarks: 'High output run, regrind bin 04 tagged',
      },
    ];
    processJsonRows(demoData);
    showToast('Loaded 3 complete daily production demo logs with rejections, downtimes, runner, and lumps data');
  };

  const handleCommitImport = () => {
    if (parsedRows.length === 0) return;

    const importedPayload: Partial<WorkOrder>[] = parsedRows.map((r) => ({
      id: r.id,
      item: r.item,
      machine: r.machine,
      shift: r.shift,
      qty: r.qty,
      completed: r.completed,
      scrap: r.scrap,
      runnerQty: r.runnerKg,
      lumbesQty: r.lumpsKg,
      runnerWeightKg: r.runnerKg,
      lumpsWeightKg: r.lumpsKg,
      downtimeMin: r.downtimeMin,
      rejectionBreakdown: r.rejectionBreakdown,
      downtimeIntervals: r.downtimeIntervals,
      rejectionReason: r.rejectionBreakdown.length > 0 ? r.rejectionBreakdown.map((x) => `${x.reason}: ${x.qty} pcs`).join('; ') : undefined,
      downtimeLogs: r.downtimeIntervals.map((i) => ({
        time: i.fromTime,
        reason: i.reason,
        min: i.min,
        by: i.by || r.operator,
      })),
      operator: r.operator,
      status: r.status,
      remark: r.remark,
    }));

    onImportProductionData(importedPayload, importMode);
    showToast(`Successfully imported ${importedPayload.length} production records (${importMode === 'update' ? 'Updated existing' : 'Appended new'})`);
    onClose();
  };

  // Calculate aggregates in preview
  const totalPlanned = parsedRows.reduce((s, r) => s + r.qty, 0);
  const totalGood = parsedRows.reduce((s, r) => s + r.completed, 0);
  const totalScrap = parsedRows.reduce((s, r) => s + r.scrap, 0);
  const totalRunner = parsedRows.reduce((s, r) => s + r.runnerKg, 0);
  const totalLumps = parsedRows.reduce((s, r) => s + r.lumpsKg, 0);
  const totalDowntime = parsedRows.reduce((s, r) => s + r.downtimeMin, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-[#FAF9F5] rounded-2xl border border-[#E4E0D6] max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#E4E0D6] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shadow-2xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#14213D]">Excel / CSV Daily Production Data Uploader</h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Batch Ingestion
                </span>
              </div>
              <p className="text-xs text-[#6B7280]">
                Upload shift logs with multiple rejection reasons, From-To downtimes, runner, and lumps data
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#6B7280] hover:text-[#14213D] hover:bg-[#F6F4EF] border border-transparent hover:border-[#E4E0D6] transition-all"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-5 pt-3 bg-white border-b border-[#E4E0D6] flex items-center justify-between gap-4">
          <div className="flex gap-2 text-xs font-bold">
            <button
              onClick={() => setActiveTab('upload')}
              className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
                activeTab === 'upload'
                  ? 'border-[#0F8B8D] text-[#0F8B8D]'
                  : 'border-transparent text-[#6B7280] hover:text-[#14213D]'
              }`}
            >
              <Upload className="w-4 h-4" /> 1. Upload File / Template
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              disabled={parsedRows.length === 0}
              className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
                activeTab === 'preview'
                  ? 'border-[#0F8B8D] text-[#0F8B8D]'
                  : 'border-transparent text-[#6B7280] hover:text-[#14213D] disabled:opacity-40'
              }`}
            >
              <Layers className="w-4 h-4" /> 2. Data Validation &amp; Mapping ({parsedRows.length} Rows)
            </button>
          </div>

          <div className="flex items-center gap-2 pb-2">
            <button
              type="button"
              onClick={() => handleDownloadTemplate('xlsx')}
              className="px-2.5 py-1 rounded-lg border border-[#E4E0D6] hover:bg-[#F6F4EF] text-[#14213D] text-[11px] font-bold flex items-center gap-1 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" /> Template (.xlsx)
            </button>
            <button
              type="button"
              onClick={() => handleDownloadTemplate('csv')}
              className="px-2.5 py-1 rounded-lg border border-[#E4E0D6] hover:bg-[#F6F4EF] text-[#14213D] text-[11px] font-bold flex items-center gap-1 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#0F8B8D]" /> Template (.csv)
            </button>
          </div>
        </div>

        {/* Tab 1: Upload and Dropzone */}
        {activeTab === 'upload' && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {/* Drag & Drop Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                const file = e.dataTransfer.files?.[0];
                if (file) readUploadedFile(file);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-[#0F8B8D] bg-teal-50/60 scale-[0.99]'
                  : 'border-[#CBD5E1] bg-white hover:border-[#0F8B8D] hover:bg-teal-50/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-14 h-14 rounded-2xl bg-[#0F8B8D]/10 text-[#0F8B8D] flex items-center justify-center mb-3">
                <Upload className="w-7 h-7" />
              </div>

              <div className="text-base font-bold text-[#14213D]">
                Drop your Daily Production spreadsheet here or click to browse
              </div>
              <p className="text-xs text-[#6B7280] mt-1 max-w-md">
                Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv) files. Automatically parses good quantities, multiple rejection defects, From-To downtime stops, and scrap weights.
              </p>

              <button
                type="button"
                className="mt-4 px-4 py-2 rounded-xl bg-[#0F8B8D] hover:bg-[#0c7072] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <FileText className="w-4 h-4" />
                Select File from Computer
              </button>
            </div>

            {/* Quick Demo Loader & Specifications */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white border border-[#E4E0D6] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#14213D] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    Instant Sandbox Test
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                    No file needed
                  </span>
                </div>
                <p className="text-xs text-[#6B7280]">
                  Load pre-built plastics manufacturing shift logs with 3 sample work orders, complete with multiple rejection defect breakdown, From-To downtime logs, and runner/lumps data.
                </p>
                <button
                  type="button"
                  onClick={handleLoadSampleDemo}
                  className="mt-1 w-full py-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Load Sample Daily Production Data &rarr;
                </button>
              </div>

              <div className="p-4 rounded-xl bg-[#F6F4EF] border border-[#E4E0D6] space-y-1.5 text-xs">
                <div className="font-bold text-[#14213D] flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Supported Column Headers
                </div>
                <ul className="text-[#6B7280] space-y-1 text-[11px]">
                  <li>&bull; <b className="text-[#14213D]">WO_Number</b>: Unique work order key (e.g. WO-1001)</li>
                  <li>&bull; <b className="text-[#14213D]">Actual_Good / Scrap_Qty</b>: Pieces produced</li>
                  <li>&bull; <b className="text-[#14213D]">Rejection_Breakdown</b>: Format: <code>Short Shot:15; Flash:5</code></li>
                  <li>&bull; <b className="text-[#14213D]">Downtime_Intervals</b>: Format: <code>08:00-08:30:Mold Setup</code></li>
                  <li>&bull; <b className="text-[#14213D]">Runner_Kg &amp; Lumps_Kg</b>: Regrind &amp; purge scrap weights in kg</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Validation & Preview */}
        {activeTab === 'preview' && (
          <div className="flex-1 overflow-hidden flex flex-col p-4 sm:p-5 space-y-4">
            {/* Aggregate Telemetry Banner */}
            <div className="p-3 bg-white rounded-xl border border-[#E4E0D6] grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-[#FAF9F5] border border-[#E4E0D6]">
                <div className="text-[10px] font-bold uppercase text-[#6B7280]">Planned</div>
                <div className="font-mono font-bold text-[#14213D] text-sm">{totalPlanned.toLocaleString()}</div>
              </div>
              <div className="p-2 rounded-lg bg-[#FAF9F5] border border-[#E4E0D6]">
                <div className="text-[10px] font-bold uppercase text-[#6B7280]">Actual Good</div>
                <div className="font-mono font-bold text-emerald-700 text-sm">{totalGood.toLocaleString()}</div>
              </div>
              <div className="p-2 rounded-lg bg-[#FAF9F5] border border-[#E4E0D6]">
                <div className="text-[10px] font-bold uppercase text-[#6B7280]">Total Scrap</div>
                <div className="font-mono font-bold text-rose-700 text-sm">{totalScrap.toLocaleString()}</div>
              </div>
              <div className="p-2 rounded-lg bg-[#FAF9F5] border border-[#E4E0D6]">
                <div className="text-[10px] font-bold uppercase text-[#6B7280]">Runner (kg)</div>
                <div className="font-mono font-bold text-teal-700 text-sm">{totalRunner.toFixed(1)}</div>
              </div>
              <div className="p-2 rounded-lg bg-[#FAF9F5] border border-[#E4E0D6]">
                <div className="text-[10px] font-bold uppercase text-[#6B7280]">Lumps (kg)</div>
                <div className="font-mono font-bold text-amber-700 text-sm">{totalLumps.toFixed(1)}</div>
              </div>
              <div className="p-2 rounded-lg bg-[#FAF9F5] border border-[#E4E0D6]">
                <div className="text-[10px] font-bold uppercase text-[#6B7280]">Downtime</div>
                <div className="font-mono font-bold text-indigo-700 text-sm">{totalDowntime} min</div>
              </div>
            </div>

            {/* Ingestion Mode Configuration */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#F6F4EF] border border-[#E4E0D6] text-xs">
              <div className="flex items-center gap-3">
                <span className="font-bold text-[#14213D]">Import Policy:</span>
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-[#14213D]">
                  <input
                    type="radio"
                    name="importMode"
                    value="update"
                    checked={importMode === 'update'}
                    onChange={() => setImportMode('update')}
                    className="text-[#0F8B8D]"
                  />
                  <span>Match &amp; Update Existing WOs (Recommended)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-[#14213D]">
                  <input
                    type="radio"
                    name="importMode"
                    value="append"
                    checked={importMode === 'append'}
                    onChange={() => setImportMode('append')}
                    className="text-[#0F8B8D]"
                  />
                  <span>Append as New Daily Entries</span>
                </label>
              </div>

              <div className="text-[#6B7280] font-mono text-[11px]">
                Source: <b>{fileName || 'Spreadsheet Upload'}</b>
              </div>
            </div>

            {/* Preview Table */}
            <div className="flex-1 overflow-x-auto overflow-y-auto border border-[#E4E0D6] rounded-xl bg-white shadow-2xs">
              <table className="w-full text-left text-xs border-collapse min-w-[950px]">
                <thead className="sticky top-0 bg-[#F6F4EF] text-[#6B7280] font-bold border-b border-[#E4E0D6] shadow-2xs z-10">
                  <tr>
                    <th className="p-2.5 w-10">Status</th>
                    <th className="p-2.5 w-28">WO #</th>
                    <th className="p-2.5 w-32">Machine / Shift</th>
                    <th className="p-2.5 text-right w-20">Planned</th>
                    <th className="p-2.5 text-right w-20">Good Output</th>
                    <th className="p-2.5 text-right w-20">Scrap</th>
                    <th className="p-2.5 w-44">Rejection Breakdown</th>
                    <th className="p-2.5 w-40">Downtime Logs</th>
                    <th className="p-2.5 text-right w-24">Runner (kg)</th>
                    <th className="p-2.5 text-right w-24">Lumps (kg)</th>
                    <th className="p-2.5 w-24">Operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E0D6]">
                  {parsedRows.map((row, idx) => (
                    <tr key={row.id || idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2.5">
                        {row.validationStatus === 'valid' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" title="Valid matching WO" />
                        ) : row.validationStatus === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-500" title={row.validationMessage} />
                        ) : (
                          <Sparkles className="w-4 h-4 text-purple-600" title="New entry" />
                        )}
                      </td>
                      <td className="p-2.5 font-mono font-bold text-[#0F8B8D]">{row.id}</td>
                      <td className="p-2.5">
                        <div className="font-semibold text-[#14213D]">{row.machine || 'Auto Bay'}</div>
                        <div className="text-[10px] text-[#6B7280]">{row.shift}</div>
                      </td>
                      <td className="p-2.5 text-right font-mono text-[#14213D]">{row.qty.toLocaleString()}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                        {row.completed.toLocaleString()}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-rose-700">
                        {row.scrap.toLocaleString()}
                      </td>
                      <td className="p-2.5">
                        {row.rejectionBreakdown.length > 0 ? (
                          <div className="space-y-0.5">
                            {row.rejectionBreakdown.map((rej, rIdx) => (
                              <div
                                key={rIdx}
                                className="text-[10px] font-medium text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded flex items-center justify-between"
                              >
                                <span className="truncate max-w-[130px]">{rej.reason}</span>
                                <span className="font-mono font-bold ml-1">{rej.qty}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#9CA3AF]">None</span>
                        )}
                      </td>
                      <td className="p-2.5">
                        {row.downtimeIntervals.length > 0 ? (
                          <div className="space-y-0.5">
                            {row.downtimeIntervals.map((dwn, dIdx) => (
                              <div
                                key={dIdx}
                                className="text-[10px] font-medium text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded flex items-center justify-between"
                              >
                                <span className="truncate max-w-[110px]">
                                  {dwn.fromTime}-{dwn.toTime} {dwn.reason}
                                </span>
                                <span className="font-mono font-bold ml-1">{dwn.min}m</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#9CA3AF]">0 min</span>
                        )}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-teal-800">
                        {row.runnerKg > 0 ? `${row.runnerKg.toFixed(1)} kg` : '0 kg'}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-amber-800">
                        {row.lumpsKg > 0 ? `${row.lumpsKg.toFixed(1)} kg` : '0 kg'}
                      </td>
                      <td className="p-2.5 text-[#14213D] font-medium">{row.operator}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-[#E4E0D6] flex items-center justify-between">
          <div className="text-xs text-[#6B7280]">
            {parsedRows.length > 0 ? (
              <span>
                Total Rows Ready: <b className="text-[#14213D] font-mono">{parsedRows.length}</b> &bull; Good: <b className="text-emerald-700 font-mono">{totalGood}</b> &bull; Scrap: <b className="text-rose-700 font-mono">{totalScrap}</b> &bull; Runner: <b className="text-teal-700 font-mono">{totalRunner.toFixed(1)}kg</b> &bull; Lumps: <b className="text-amber-700 font-mono">{totalLumps.toFixed(1)}kg</b>
              </span>
            ) : (
              'Upload a sheet or load demo data to review rows before importing'
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#E4E0D6] bg-white hover:bg-[#F6F4EF] text-xs font-bold text-[#14213D] transition-colors"
            >
              Cancel
            </button>
            {activeTab === 'preview' && (
              <button
                type="button"
                onClick={handleCommitImport}
                disabled={parsedRows.length === 0}
                className="px-4 py-2 rounded-xl bg-[#0F8B8D] hover:bg-[#0c7072] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                Apply Import to Production Grid ({parsedRows.length} Rows)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
