import React from 'react';
import {
  X,
  Printer,
  Download,
  FileSpreadsheet,
  Layers,
} from 'lucide-react';
import {
  ConsolidatedMatrixResult,
  exportConsolidatedMatrixToExcel,
} from './jitCalculations';

interface Props {
  matrix: ConsolidatedMatrixResult;
  onClose: () => void;
}

export const JitConsolidatedMaterialReqModal: React.FC<Props> = ({ matrix, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = ['SI. NO', 'Description', 'Stock Code', 'UOM', ...matrix.machines.map((m) => m.shortCode), 'Total'];
    const lines = [headers.join(',')];

    for (const r of matrix.rows) {
      const row = [
        r.siNo,
        `"${r.description.replace(/"/g, '""')}"`,
        `"${r.stockCode}"`,
        `"${r.uom}"`,
        ...matrix.machines.map((m) => r.machineDemands[m.id] !== undefined ? r.machineDemands[m.id] : ''),
        r.total,
      ];
      lines.push(row.join(','));
    }

    // Total row
    const totalRow = [
      '',
      '"Total"',
      '',
      '',
      ...matrix.machines.map((m) => matrix.columnTotals[m.id] || ''),
      matrix.grandTotal,
    ];
    lines.push(totalRow.join(','));

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(lines.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `Consolidated_Material_Req_${matrix.scheduleNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200 print:p-0 print:static print:bg-white print:backdrop-blur-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden print:max-h-none print:shadow-none print:border-none print:w-full">
        {/* Modal Action Header (hidden during print) */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Consolidated Material Requirement (CMR)
                </h3>
                <span className="font-mono text-xs font-bold bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full">
                  {matrix.scheduleNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Machine-wise BOM Material Requirement Matrix for Production Date:{' '}
                <strong className="text-slate-800">{matrix.planDate}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              type="button"
              onClick={() => exportConsolidatedMatrixToExcel(matrix)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Export to Excel Spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              title="Export to CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div className="p-6 overflow-x-auto overflow-y-auto flex-1 bg-white print:p-2">
          {/* Paper Title & Metadata */}
          <div className="mb-4 pb-3 border-b-2 border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                PLASTECH INJECTION MANUFACTURING SYSTEM
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                CONSOLIDATED MATERIAL REQUIREMENT BY MACHINE
              </h1>
            </div>

            <div className="text-right text-xs space-y-0.5">
              <div className="font-mono font-bold text-slate-900">
                SCHEDULE REF: <span className="text-indigo-700">{matrix.scheduleNumber}</span>
              </div>
              <div className="text-slate-600 font-medium">
                Production Date: <strong>{matrix.planDate}</strong> &bull; Total Machines:{' '}
                <strong>{matrix.machines.length} IMMs</strong>
              </div>
            </div>
          </div>

          {/* Reference Screenshot 4 Table Layout */}
          {matrix.rows.length === 0 ? (
            <div className="p-10 text-center text-slate-500 text-xs">
              No material requirements found for this schedule. Add jobs to the schedule first.
            </div>
          ) : (
            <div className="overflow-x-auto border border-black shadow-none">
              <table className="w-full text-left text-xs border-collapse border border-black">
                <thead>
                  {/* Top Header Layer: SI NO, Description, Stock Code, UOM, Machine No. (Colspan), Total */}
                  <tr className="bg-[#EAEAEA] text-black font-bold text-[11px] border-b border-black">
                    <th className="py-2 px-2.5 w-12 text-center border-r border-black" rowSpan={2}>
                      SI. NO
                    </th>
                    <th className="py-2 px-3 border-r border-black min-w-[200px]" rowSpan={2}>
                      Description
                    </th>
                    <th className="py-2 px-3 border-r border-black min-w-[100px]" rowSpan={2}>
                      Stock Code
                    </th>
                    <th className="py-2 px-2.5 w-16 text-center border-r border-black" rowSpan={2}>
                      UOM
                    </th>
                    <th
                      className="py-1 px-2 text-center border-b border-r border-black"
                      colSpan={matrix.machines.length}
                    >
                      Machine No.
                    </th>
                    <th className="py-2 px-3 text-right w-28" rowSpan={2}>
                      Total
                    </th>
                  </tr>

                  {/* Sub-header row with Machine Short Codes (S-03, S-04, S-05, etc.) */}
                  <tr className="bg-[#F4F4F4] text-black font-bold text-[11px] border-b border-black">
                    {matrix.machines.map((m) => (
                      <th
                        key={m.id}
                        className="py-1.5 px-2 text-center border-r border-black min-w-[70px]"
                        title={`${m.shortCode}: ${m.id} (${m.name})`}
                      >
                        {m.shortCode}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-black/40 text-black">
                  {matrix.rows.map((row) => (
                    <tr key={row.siNo} className="hover:bg-indigo-50/30 print:hover:bg-transparent">
                      {/* SI NO */}
                      <td className="py-1.5 px-2.5 text-center font-mono font-medium border-r border-black">
                        {row.siNo}
                      </td>

                      {/* Description */}
                      <td className="py-1.5 px-3 font-semibold border-r border-black">
                        {row.description}
                      </td>

                      {/* Stock Code */}
                      <td className="py-1.5 px-3 font-mono text-[11px] border-r border-black">
                        {row.stockCode}
                      </td>

                      {/* UOM */}
                      <td className="py-1.5 px-2.5 text-center font-bold text-[11px] border-r border-black uppercase">
                        {row.uom}
                      </td>

                      {/* Machine values */}
                      {matrix.machines.map((m) => {
                        const val = row.machineDemands[m.id];
                        return (
                          <td
                            key={m.id}
                            className="py-1.5 px-2 text-center font-mono border-r border-black text-[11px]"
                          >
                            {val !== undefined ? val.toFixed(4) : ''}
                          </td>
                        );
                      })}

                      {/* Total */}
                      <td className="py-1.5 px-3 text-right font-mono font-bold text-[11px] bg-slate-50/50 print:bg-transparent">
                        {row.total.toFixed(4)}
                      </td>
                    </tr>
                  ))}

                  {/* Summary Bottom Row matching Screenshot 4: Total, column sums & grand total */}
                  <tr className="bg-[#D9EAF7] font-black text-black text-xs border-t-2 border-black">
                    <td colSpan={4} className="py-2 px-3 text-center border-r border-black uppercase tracking-wider font-extrabold">
                      Total
                    </td>
                    {matrix.machines.map((m) => (
                      <td
                        key={m.id}
                        className="py-2 px-2 text-center font-mono font-extrabold border-r border-black text-[11px]"
                      >
                        {(matrix.columnTotals[m.id] || 0).toFixed(4)}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right font-mono font-black text-xs bg-[#B8D7EF] print:bg-transparent">
                      {matrix.grandTotal.toFixed(4)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Footer note matching shop floor standard */}
          <div className="mt-4 pt-3 border-t border-slate-300 text-[10px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
            <span>
              Generated by SP-PLASTECH JIT MRP Engine &bull; Validated against Connected Plant Stores
            </span>
            <span>Document Ref: PLASTECH-CMR-{matrix.scheduleNumber}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
