import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  Download,
  Sparkles,
  ArrowRight,
  Database,
  RefreshCw,
  Info
} from 'lucide-react';
import { ItemMasterSchema, ItemMasterDto } from '../../lib/api-client';

interface ItemGridImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: ItemMasterDto[]) => Promise<any>;
  onSuccessToast: (msg: string) => void;
}

interface ParsedRow {
  rowNum: number;
  data: Partial<ItemMasterDto>;
  isValid: boolean;
  errors: string[];
}

export const ItemGridImportModal: React.FC<ItemGridImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  onSuccessToast,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'complete'>('upload');
  const [filterMode, setFilterMode] = useState<'all' | 'valid' | 'invalid'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  const downloadSampleTemplate = () => {
    const sampleHeaders = [
      'code',
      'name',
      'type',
      'category',
      'wh',
      'plant',
      'base_uom',
      'cycle_time',
      'cavity_count',
      'part_weight_grams',
      'runner_weight_grams',
      'shot_weight_grams',
      'resin_type',
      'standard_cost',
      'safety_stock',
      'reorder_level',
      'lead_time',
      'supplier',
      'status',
      'approval_status',
    ];

    const sampleRows = [
      [
        'SKU-INJ-1001',
        'Auto HVAC Louver Blade Black',
        'Finished Good',
        'INJECTION MOLDING',
        'FG_WH_A',
        'Plant 1 - Pimpri Auto-Hub',
        'PCS',
        24.5,
        4,
        42.5,
        12.0,
        182.0,
        'PP (Polypropylene)',
        14.5,
        500,
        1000,
        '3 Days',
        'Tata Motors Vendor Div',
        'active',
        'approved',
      ],
      [
        'SKU-RAW-2005',
        'Polypropylene Homopolymer Grade H110MA',
        'Raw Material',
        'RESIN RAW MATERIAL',
        'RAW_STORE_1',
        'Plant 1 - Pimpri Auto-Hub',
        'KG',
        0,
        1,
        0,
        0,
        0,
        'PP Homopolymer',
        118.0,
        2500,
        5000,
        '7 Days',
        'Reliance Industries Ltd',
        'active',
        'approved',
      ],
    ];

    const csvContent = [sampleHeaders.join(','), ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(','))].join(
      '\n'
    );

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `item_master_import_template_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsLoading(true);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      const parsed: ParsedRow[] = json.map((row, idx) => {
        // Normalize column keys
        const itemObj: Record<string, any> = {
          code: String(row.code || row['Item Code'] || row.SKU || '').trim(),
          name: String(row.name || row['Item Name'] || row.Description || '').trim(),
          type: String(row.type || row['Item Type'] || 'Finished Good').trim(),
          category: String(row.category || row.cat || row.Category || 'INJECTION MOLDING').trim(),
          cat: String(row.cat || row.category || row.Category || 'INJECTION MOLDING').trim(),
          wh: String(row.wh || row.Warehouse || 'FG_WH_A').trim(),
          plant: String(row.plant || row.Plant || 'Plant 1 - Pimpri Auto-Hub').trim(),
          base_uom: String(row.base_uom || row.baseUOM || row['Base UOM'] || 'PCS').trim(),
          baseUOM: String(row.baseUOM || row.base_uom || row['Base UOM'] || 'PCS').trim(),
          cycle_time: Number(row.cycle_time || row.cycleTime || row['Cycle Time (s)'] || 0),
          cavity_count: Number(row.cavity_count || row.cavityCount || row.Cavities || 1),
          part_weight_grams: Number(row.part_weight_grams || row.partWeightGrams || row['Part Weight (g)'] || 0),
          runner_weight_grams: Number(row.runner_weight_grams || row.runnerWeightGrams || 0),
          shot_weight_grams: Number(row.shot_weight_grams || row.shotWeightGrams || 0),
          resin_type: String(row.resin_type || row.resinType || row['Resin / Material'] || '').trim(),
          standard_cost: Number(row.standard_cost || row.standardCost || row.cost || row['Standard Cost (INR)'] || 0),
          safety_stock: Number(row.safety_stock || row.safetyStock || 0),
          reorder_level: Number(row.reorder_level || row.reorderLevel || 0),
          lead_time: String(row.lead_time || row.leadTime || '3 Days').trim(),
          supplier: String(row.supplier || row.Supplier || '').trim(),
          status: String(row.status || 'active').toLowerCase(),
          approval_status: String(row.approval_status || row.approval || 'approved').toLowerCase(),
        };

        // Zod validation
        const valResult = ItemMasterSchema.safeParse(itemObj);
        if (valResult.success) {
          return {
            rowNum: idx + 2,
            data: valResult.data as ItemMasterDto,
            isValid: true,
            errors: [],
          };
        } else {
          return {
            rowNum: idx + 2,
            data: itemObj as ItemMasterDto,
            isValid: false,
            errors: valResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
          };
        }
      });

      setParsedRows(parsed);
      setStep('preview');
    } catch (err: any) {
      alert(`Failed to parse file: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleExecuteImport = async () => {
    const validItems = parsedRows.filter((r) => r.isValid).map((r) => r.data as ItemMasterDto);
    if (validItems.length === 0) {
      alert('No valid items found to import.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onImport(validItems);
      onSuccessToast(`✓ Successfully imported & synced ${validItems.length} items to database!`);
      setStep('complete');
    } catch (err: any) {
      alert(`Import error: ${err.message || 'Failed to save items'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayedRows = parsedRows.filter((r) => {
    if (filterMode === 'valid') return r.isValid;
    if (filterMode === 'invalid') return !r.isValid;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-teal-50/50 via-white to-amber-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F8B8D] text-white flex items-center justify-center text-lg font-bold shadow-xs">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#14213D]">Grid In: Bulk Import Master Items</h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-teal-100 text-[#0F8B8D]">
                  ZOD SCHEMA VALIDATED
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Direct batch injection into Supabase PostgREST with TanStack React Query real-time cache synchronization.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Drag & Drop Box */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/30 hover:bg-teal-50/60 transition-all rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.json"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                <div className="w-16 h-16 rounded-2xl bg-teal-100 text-[#0F8B8D] group-hover:scale-110 group-hover:bg-[#0F8B8D] group-hover:text-white transition-all flex items-center justify-center mb-4 shadow-sm">
                  <FileSpreadsheet className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-bold text-[#14213D] mb-1">
                  Drag &amp; Drop CSV or Excel Spreadsheet (.xlsx, .csv)
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mb-4">
                  Upload catalog with tooling specifications, cycle times, weights, and UOM mapping.
                </p>
                <span className="btn btn-sm btn-primary flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" /> Select File from Computer
                </span>
              </div>

              {/* Quick Instructions & Sample Download */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Need a pre-formatted structure?</div>
                    <div className="text-[11px] text-slate-500">
                      Download the official SP-Plastech Item Master CSV template with standard column headers.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={downloadSampleTemplate}
                  className="btn btn-sm btn-ghost border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" /> Download Template
                </button>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Database className="w-4 h-4 text-slate-500" />
                    Total Parsed: <span className="font-mono text-slate-900">{parsedRows.length}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Valid Records: <span className="font-mono text-emerald-800">{validCount}</span>
                  </div>
                  {invalidCount > 0 && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      Validation Errors: <span className="font-mono text-rose-800">{invalidCount}</span>
                    </div>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setFilterMode('all')}
                    className={`px-2.5 py-1 text-xs font-bold rounded ${
                      filterMode === 'all' ? 'bg-[#0F8B8D] text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    All ({parsedRows.length})
                  </button>
                  <button
                    onClick={() => setFilterMode('valid')}
                    className={`px-2.5 py-1 text-xs font-bold rounded ${
                      filterMode === 'valid' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Valid ({validCount})
                  </button>
                  {invalidCount > 0 && (
                    <button
                      onClick={() => setFilterMode('invalid')}
                      className={`px-2.5 py-1 text-xs font-bold rounded ${
                        filterMode === 'invalid' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Errors ({invalidCount})
                    </button>
                  )}
                </div>
              </div>

              {/* Data Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[380px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Row</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Item Code</th>
                      <th className="py-2.5 px-3">Item Name</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">UOM</th>
                      <th className="py-2.5 px-3">Cycle Time</th>
                      <th className="py-2.5 px-3">Resin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {displayedRows.map((row) => (
                      <tr
                        key={row.rowNum}
                        className={row.isValid ? 'hover:bg-teal-50/40' : 'bg-rose-50/50 hover:bg-rose-50'}
                      >
                        <td className="py-2 px-3 font-mono text-slate-500">{row.rowNum}</td>
                        <td className="py-2 px-3">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Valid
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full cursor-help"
                              title={row.errors.join(', ')}
                            >
                              <AlertTriangle className="w-3 h-3" /> Error
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-800">{row.data.code || '—'}</td>
                        <td className="py-2 px-3 text-slate-700 max-w-[180px] truncate" title={row.data.name}>
                          {row.data.name || '—'}
                        </td>
                        <td className="py-2 px-3 text-slate-600">{row.data.type || '—'}</td>
                        <td className="py-2 px-3 text-slate-600">{row.data.category || row.data.cat || '—'}</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{row.data.baseUOM || row.data.base_uom || 'PCS'}</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{row.data.standardCycleTime || row.data.cycle_time || row.data.cycleTimeSec || 0}s</td>
                        <td className="py-2 px-3 text-slate-600">{row.data.resinType || row.data.resin_type || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-[#14213D]">Import Successfully Completed</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                All valid items have been validated, stored in the database, and TanStack React Query cache has been
                synchronized across all active instances.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-primary px-6 py-2 text-xs font-bold"
              >
                Return to Item Master
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {step !== 'complete' && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={step === 'preview' ? () => setStep('upload') : onClose}
              className="btn btn-sm btn-ghost border border-slate-300 text-slate-700 text-xs font-semibold"
            >
              {step === 'preview' ? 'Choose Different File' : 'Cancel'}
            </button>

            {step === 'preview' && (
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isSubmitting || validCount === 0}
                className="btn btn-sm btn-primary flex items-center gap-2 text-xs font-bold shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Importing to DB...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> Execute Import ({validCount} items)
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
