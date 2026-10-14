import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Move,
  Save,
  Download,
  Sliders,
  BarChart3,
  Table as TableIcon,
  PieChart,
  Layers,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { analyticsApi } from '../../services/analytics/analytics.api';

interface BuilderSection {
  id: string;
  type: string;
  name: string;
  title: string;
  description: string;
  config: Record<string, any>;
}

interface CustomDocumentBuilderProps {
  onNavigate?: (view: string, param?: any) => void;
  showToast?: (msg: string) => void;
}

export const CustomDocumentBuilder: React.FC<CustomDocumentBuilderProps> = ({
  onNavigate,
  showToast = (_m: string) => {},
}) => {
  const [templateName, setTemplateName] = useState('Monthly Plant Operations & Quality Audit');
  const [category, setCategory] = useState('Production');
  const [sections, setSections] = useState<BuilderSection[]>([
    {
      id: 'sec-1',
      type: 'kpi_summary',
      name: 'KPI Executive Card',
      title: 'Monthly Executive Scorecard',
      description: 'Overall Revenue, OEE, Scrap Rate & OTIF summary with variance sparklines.',
      config: { period: '2026-09', compareWithPrevious: true },
    },
    {
      id: 'sec-2',
      type: 'pareto_chart',
      name: 'Loss Pareto Chart',
      title: '6 Big Losses Pareto Distribution',
      description: 'Downtime reasons ranked by total stoppage hours with cumulative % curve.',
      config: { chartType: 'BarCumulative', thresholdLimit: 10 },
    },
    {
      id: 'sec-3',
      type: 'quality_table',
      name: 'Quality Defect Matrix',
      title: 'IATF 16949 PPM & Defect Breakdown',
      description: 'Item-wise defect counts, PPM, Sigma level, and Cost of Poor Quality (COPQ).',
      config: { showSixSigma: true, filterHighRiskOnly: false },
    },
  ]);

  const [availableWidgets] = useState([
    { id: 'kpi_summary', name: 'KPI Scorecard Card', icon: Sparkles, desc: 'High-level metric gauge card with variance' },
    { id: 'pareto_chart', name: 'Loss Pareto Chart', icon: BarChart3, desc: 'Ranked Pareto chart with 80/20 threshold' },
    { id: 'quality_table', name: 'Quality Defect Matrix', icon: TableIcon, desc: 'Tabular PPM defect analysis & COPQ' },
    { id: 'inventory_aging', name: 'Stock Aging Distribution', icon: PieChart, desc: '0-180+ days valuation donut chart' },
    { id: 'esg_carbon', name: 'ESG Carbon Intensity Meter', icon: Layers, desc: 'Scope 1-3 footprint and recycled resin %' },
    { id: 'maintenance_mtbf', name: 'MTBF & MTTR Trend Line', icon: Sliders, desc: 'Asset reliability & repair hour curves' },
  ]);

  const [isSaving, setIsSaving] = useState(false);

  const handleAddWidget = (w: (typeof availableWidgets)[0]) => {
    const newSec: BuilderSection = {
      id: `sec-${Date.now()}`,
      type: w.id,
      name: w.name,
      title: `Custom ${w.name}`,
      description: w.desc,
      config: {},
    };
    setSections((prev) => [...prev, newSec]);
    showToast(`Added ${w.name} to template layout`);
  };

  const handleRemoveSection = (secId: string) => {
    setSections((prev) => prev.filter((s) => s.id !== secId));
    showToast('Removed section from layout');
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setSections((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === sections.length - 1) return;
    setSections((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleSaveTemplate = async () => {
    setIsSaving(true);
    try {
      await analyticsApi.createDocumentTemplate({
        templateCode: `RPT-CUST-${Date.now().toString().slice(-4)}`,
        templateName,
        category,
        templateType: 'CUSTOM',
        structure: { sections },
      });
      showToast('Document template saved to enterprise repository!');
    } catch {
      showToast('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#E8622C] flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Custom Document &amp; Report Builder
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Design executive PDF &amp; Excel report structures with modular analytics blocks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveTemplate}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#E8622C] text-white hover:bg-[#d45422] flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Template'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Template Config & Widget Palette */}
        <div className="space-y-4">
          {/* Template Details Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Template Attributes</h2>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Template Title</label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#0F8B8D]"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Functional Domain</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#0F8B8D]"
              >
                <option value="Production">Production &amp; OEE</option>
                <option value="Quality">Quality &amp; IATF Compliance</option>
                <option value="SupplyChain">Supply Chain &amp; Inventory</option>
                <option value="Sustainability">ESG &amp; Carbon Footprint</option>
                <option value="Maintenance">Plant Maintenance</option>
              </select>
            </div>
          </div>

          {/* Widget Palette */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2.5">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Available Analytics Blocks</h2>
            <p className="text-[11px] text-slate-500 mb-2">Click to append block into document structure:</p>
            <div className="space-y-2">
              {availableWidgets.map((w) => {
                const Icon = w.icon;
                return (
                  <div
                    key={w.id}
                    onClick={() => handleAddWidget(w)}
                    className="p-3 rounded-xl border border-slate-200 hover:border-[#0F8B8D] hover:bg-teal-50/40 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-[#0F8B8D]/10 text-slate-600 group-hover:text-[#0F8B8D] flex items-center justify-center shrink-0 transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 group-hover:text-[#0F8B8D]">{w.name}</div>
                        <div className="text-[10px] text-slate-500 line-clamp-1">{w.desc}</div>
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-slate-400 group-hover:text-[#0F8B8D] shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Document Canvas & Section Ordering */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#0F8B8D]" />
                <span>Document Structure ({sections.length} Ordered Sections)</span>
              </h2>
              <span className="text-[10px] text-slate-400">PDF Layout Preview</span>
            </div>

            <div className="mt-4 space-y-3">
              {sections.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-60" />
                  <p className="text-xs font-bold text-slate-600">No sections added yet</p>
                  <p className="text-[11px] text-slate-400">Click blocks from the left palette to construct your report.</p>
                </div>
              ) : (
                sections.map((sec, idx) => (
                  <div
                    key={sec.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-start justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-lg bg-[#14213D] text-white text-xs font-bold font-mono flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{sec.title}</span>
                          <span className="text-[9px] font-bold text-[#0F8B8D] bg-teal-50 border border-teal-200 px-1.5 py-0.2 rounded font-mono">
                            {sec.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{sec.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleMoveUp(idx)}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        &uarr;
                      </button>
                      <button
                        onClick={() => handleMoveDown(idx)}
                        disabled={idx === sections.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        &darr;
                      </button>
                      <button
                        onClick={() => handleRemoveSection(sec.id)}
                        className="p-1 text-rose-400 hover:text-rose-600 cursor-pointer ml-1"
                        title="Remove Section"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
