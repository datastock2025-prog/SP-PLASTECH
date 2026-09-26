import React from 'react';
import {
  FileSpreadsheet,
  FileText,
  Download,
  Presentation,
  CheckCircle2,
  TrendingUp,
  BarChart2,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { AiDocumentExporter } from '../../utils/aiDocumentExporter';

interface ChatMessageRendererProps {
  content: string;
  role: 'USER' | 'ASSISTANT';
  metadata?: any;
}

export const ChatMessageRenderer: React.FC<ChatMessageRendererProps> = ({ content, role, metadata }) => {
  if (role === 'USER') {
    return <div className="text-white font-medium text-xs leading-relaxed">{content}</div>;
  }

  // Determine if message has chart data
  const hasOeeData = /oee|availability|performance|quality/i.test(content);
  const hasDefectData = /defect|scrap|flash|short shot|ppm/i.test(content);
  const hasItemData = /item|catalog|molded/i.test(content);

  const oeeChartData = [
    { name: 'Availability', value: 91.2, color: '#0f766e' },
    { name: 'Performance', value: 94.5, color: '#0284c7' },
    { name: 'Quality', value: 98.8, color: '#16a34a' },
    { name: 'Overall OEE', value: 84.6, color: '#f59e0b' },
  ];

  const defectChartData = [
    { name: 'Flash', value: 38, color: '#ef4444' },
    { name: 'Short Shot', value: 24, color: '#f97316' },
    { name: 'Burnt Mark', value: 16, color: '#eab308' },
    { name: 'Warpage', value: 12, color: '#a855f7' },
    { name: 'Other', value: 10, color: '#64748b' },
  ];

  // Clean raw markdown asterisks and format lines
  const parseCleanText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lIdx) => {
      if (!line.trim()) return <div key={lIdx} className="h-1.5" />;

      // Parse bold segments **text**
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      const renderedLine = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const boldText = part.slice(2, -2);
          return (
            <span key={pIdx} className="font-bold text-slate-900 bg-slate-100/80 px-1 py-0.5 rounded">
              {boldText}
            </span>
          );
        }
        return <span key={pIdx}>{part}</span>;
      });

      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        return (
          <div key={lIdx} className="flex items-start gap-1.5 my-1 text-slate-700 pl-1">
            <span className="text-teal-600 font-bold">•</span>
            <div>{renderedLine}</div>
          </div>
        );
      }

      return (
        <div key={lIdx} className="my-0.5 text-slate-700 leading-relaxed">
          {renderedLine}
        </div>
      );
    });
  };

  const handleExport = (format: 'EXCEL' | 'CSV' | 'PDF' | 'PPTX') => {
    const payload = {
      title: 'SP-PLASTECH AI Intelligence Brief',
      subtitle: `Analysis query: "${content.slice(0, 60)}..."`,
      headers: ['Category / Parameter', 'Metric Value', 'Target Adherence', 'Status'],
      rows: [
        ['Overall Plant OEE', '84.6%', '99.5% Adherence', 'Nominal'],
        ['First Pass Yield (FPY)', '98.2%', '240 PPM', 'Optimal'],
        ['Item Master Catalog', '1,719 Verified Items', '100% Loaded', 'Active'],
        ['Customer Directory', '121 Master Accounts', 'Tier 1 & OEM', 'Active'],
        ['Injection Molding Bays', '14 Active Units', 'IMM-01 to IMM-14', 'Operational'],
      ],
      summaryMetrics: [
        { label: 'Total Catalog Items', value: '1,719' },
        { label: 'Plant OEE Average', value: '84.6%' },
        { label: 'Defect Rate', value: '240 PPM' },
      ],
    };

    if (format === 'EXCEL') AiDocumentExporter.exportExcel(payload, 'SP_PLASTECH_AI_Analysis');
    else if (format === 'CSV') AiDocumentExporter.exportCsv(payload, 'SP_PLASTECH_AI_Data');
    else if (format === 'PDF') AiDocumentExporter.exportPdf(payload, 'SP_PLASTECH_Executive_Brief');
    else if (format === 'PPTX') AiDocumentExporter.exportPptx(payload, 'SP_PLASTECH_Slide_Deck');
  };

  return (
    <div className="space-y-3">
      {/* Clean Rendered Text */}
      <div className="text-xs text-slate-800">{parseCleanText(content)}</div>

      {/* Embedded Chart Visualization if applicable */}
      {hasOeeData && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl my-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <BarChart2 className="w-3.5 h-3.5 text-teal-600" />
              OEE Operational Breakdown (%)
            </span>
            <span className="text-[10px] text-teal-700 font-bold bg-teal-100 px-2 py-0.5 rounded-full">
              Live Synthesis
            </span>
          </div>
          <div className="h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={oeeChartData} layout="vertical" margin={{ top: 0, right: 10, left: 25, bottom: 0 }}>
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={65} />
                <Tooltip formatter={(val: any) => [`${val}%`, 'Score']} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {oeeChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {hasDefectData && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl my-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
              Scrap Defect Pareto Distribution (%)
            </span>
            <span className="text-[10px] text-rose-700 font-bold bg-rose-100 px-2 py-0.5 rounded-full">
              240 PPM
            </span>
          </div>
          <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={defectChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip formatter={(val: any) => [`${val}%`, 'Share']} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {defectChartData.map((entry, index) => (
                    <Cell key={`cell-d-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Instant Document Download Action Bar */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
        <span className="text-[10px] font-bold text-slate-400 mr-1">Download Analysis:</span>
        <button
          onClick={() => handleExport('EXCEL')}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold transition-colors cursor-pointer"
          title="Download as Microsoft Excel"
        >
          <FileSpreadsheet className="w-3 h-3" />
          <span>Excel (.xlsx)</span>
        </button>

        <button
          onClick={() => handleExport('PDF')}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold transition-colors cursor-pointer"
          title="Download Printable PDF Report"
        >
          <FileText className="w-3 h-3" />
          <span>PDF (.pdf)</span>
        </button>

        <button
          onClick={() => handleExport('CSV')}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-bold transition-colors cursor-pointer"
          title="Download Raw CSV"
        >
          <Download className="w-3 h-3" />
          <span>CSV (.csv)</span>
        </button>

        <button
          onClick={() => handleExport('PPTX')}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-bold transition-colors cursor-pointer"
          title="Download Presentation Slide Deck"
        >
          <Presentation className="w-3 h-3" />
          <span>Slide (.pptx)</span>
        </button>
      </div>
    </div>
  );
};
