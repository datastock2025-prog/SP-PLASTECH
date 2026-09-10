import React, { useState } from 'react';
import { ManufacturingBomWizardState } from './types';
import { BomDocument } from '../../../types';
import {
  ShieldCheck,
  FileText,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  FileCheck2,
  Download,
  Calendar,
  AlertCircle,
  Tag,
  Paperclip,
} from 'lucide-react';

interface Step8Props {
  state: ManufacturingBomWizardState;
  onChange: (patch: Partial<ManufacturingBomWizardState>) => void;
  showToast: (msg: string) => void;
}

export const Step8QualityDocs: React.FC<Step8Props> = ({ state, onChange, showToast }) => {
  const { qualityConfig, documents } = state;

  const [dragOver, setDragOver] = useState<boolean>(false);

  // Quick toggle critical quality params
  const ALL_PARAMS = [
    'MFI (Melt Flow Index)',
    'Tensile Strength',
    'Drop Impact Test',
    'Dimensional Tolerance ±0.05mm',
    'Color Delta-E < 0.8',
    'Wall Thickness Uniformity',
    'Visual Surface Sink Marks',
    'Gate Flushness Inspection',
  ];

  const toggleParam = (param: string) => {
    const exists = qualityConfig.criticalParams.includes(param);
    const updated = exists
      ? qualityConfig.criticalParams.filter((p) => p !== param)
      : [...qualityConfig.criticalParams, param];
    onChange({
      qualityConfig: { ...qualityConfig, criticalParams: updated },
    });
  };

  // Mock file upload
  const handleSimulateUpload = (type: BomDocument['type'], name: string) => {
    const newDoc: BomDocument = {
      id: `DOC-${Date.now()}`,
      name,
      type,
      version: 'v1.0',
      effectiveDate: new Date().toISOString().split('T')[0],
      uploadedBy: 'Priya Rao',
      status: 'Active',
      fileSize: '2.4 MB',
      requiredForRelease: true,
    };
    onChange({ documents: [...documents, newDoc] });
    showToast(`Attached ${name}`);
  };

  const handleRemoveDoc = (id: string) => {
    const updated = documents.filter((d) => d.id !== id);
    onChange({ documents: updated });
    showToast('Document removed');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      <div className="border-b border-[#E4E0D6] pb-2">
        <h3 className="text-sm font-bold text-[#14213D]">Quality Specifications &amp; Engineering Documents</h3>
        <p className="text-xs text-gray-500">
          Set up inspection plan gates, critical plastic polymer tolerances, and attach technical drawings.
        </p>
      </div>

      {/* Section 1: Quality Inspection Gates */}
      <div className="bg-white border border-[#E4E0D6] rounded-xl p-5 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-2">
          <h4 className="text-xs font-bold text-[#14213D] uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Quality Control Inspection Gates
          </h4>
          <span className="text-xs text-gray-500">IATF 16949 &amp; ISO 9001 Compliance</span>
        </div>

        {/* Checkbox Gates */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          <label className="p-3 rounded-lg border bg-[#F9F8F5] flex items-center gap-2 cursor-pointer hover:bg-blue-50/50">
            <input
              type="checkbox"
              checked={qualityConfig.qualityInspectionRequired}
              onChange={(e) =>
                onChange({
                  qualityConfig: { ...qualityConfig, qualityInspectionRequired: e.target.checked },
                })
              }
              className="rounded text-blue-600"
            />
            <span className="font-bold text-[#14213D]">QC Required</span>
          </label>

          <label className="p-3 rounded-lg border bg-[#F9F8F5] flex items-center gap-2 cursor-pointer hover:bg-blue-50/50">
            <input
              type="checkbox"
              checked={qualityConfig.incomingInspectionRequired}
              onChange={(e) =>
                onChange({
                  qualityConfig: { ...qualityConfig, incomingInspectionRequired: e.target.checked },
                })
              }
              className="rounded text-blue-600"
            />
            <span className="font-bold text-[#14213D]">Incoming Raw Resin</span>
          </label>

          <label className="p-3 rounded-lg border bg-[#F9F8F5] flex items-center gap-2 cursor-pointer hover:bg-blue-50/50">
            <input
              type="checkbox"
              checked={qualityConfig.inProcessInspectionRequired}
              onChange={(e) =>
                onChange({
                  qualityConfig: { ...qualityConfig, inProcessInspectionRequired: e.target.checked },
                })
              }
              className="rounded text-blue-600"
            />
            <span className="font-bold text-[#14213D]">In-Process Hourly FAI</span>
          </label>

          <label className="p-3 rounded-lg border bg-[#F9F8F5] flex items-center gap-2 cursor-pointer hover:bg-blue-50/50">
            <input
              type="checkbox"
              checked={qualityConfig.secondaryInspectionRequired}
              onChange={(e) =>
                onChange({
                  qualityConfig: { ...qualityConfig, secondaryInspectionRequired: e.target.checked },
                })
              }
              className="rounded text-blue-600"
            />
            <span className="font-bold text-[#14213D]">Secondary Op Gate</span>
          </label>

          <label className="p-3 rounded-lg border bg-[#F9F8F5] flex items-center gap-2 cursor-pointer hover:bg-blue-50/50">
            <input
              type="checkbox"
              checked={qualityConfig.finalInspectionRequired}
              onChange={(e) =>
                onChange({
                  qualityConfig: { ...qualityConfig, finalInspectionRequired: e.target.checked },
                })
              }
              className="rounded text-blue-600"
            />
            <span className="font-bold text-[#14213D]">Final Pre-Shipment</span>
          </label>
        </div>

        {/* Inspection Plan & Sampling Rule */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs pt-2">
          <div className="field mb-0">
            <label className="text-xs font-bold text-[#14213D] block mb-1">Assigned Inspection Plan</label>
            <select
              value={qualityConfig.inspectionPlanId}
              onChange={(e) =>
                onChange({
                  qualityConfig: { ...qualityConfig, inspectionPlanId: e.target.value },
                })
              }
              className="w-full text-xs py-2 px-3 border border-[#E4E0D6] rounded-lg bg-white"
            >
              <option value="INSP-PLAN-INJ-01">INSP-PLAN-INJ-01 — Precision Injection Molding</option>
              <option value="INSP-PLAN-BLOW-02">INSP-PLAN-BLOW-02 — Blow Molding Container Leak Test</option>
              <option value="INSP-PLAN-FOOD-03">INSP-PLAN-FOOD-03 — FDA Food Contact Migration Plan</option>
            </select>
          </div>

          <div className="field mb-0">
            <label className="text-xs font-bold text-[#14213D] block mb-1">Statistical Sampling Rule</label>
            <select
              value={qualityConfig.samplingRule}
              onChange={(e) =>
                onChange({
                  qualityConfig: { ...qualityConfig, samplingRule: e.target.value },
                })
              }
              className="w-full text-xs py-2 px-3 border border-[#E4E0D6] rounded-lg bg-white"
            >
              <option value="AQL 1.0 General Inspection Level II">AQL 1.0 General Inspection Level II</option>
              <option value="AQL 0.65 Tightened Inspection">AQL 0.65 Tightened Inspection (Critical)</option>
              <option value="100% 3D Scanner Inspection">100% Automated Optical Scanner</option>
            </select>
          </div>

          <div className="field mb-0 flex items-center gap-4 pt-4">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={qualityConfig.coaRequired}
                onChange={(e) =>
                  onChange({
                    qualityConfig: { ...qualityConfig, coaRequired: e.target.checked },
                  })
                }
                className="rounded text-blue-600"
              />
              <span className="font-bold text-[#14213D]">COA Required</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={qualityConfig.customerApprovalRequired}
                onChange={(e) =>
                  onChange({
                    qualityConfig: { ...qualityConfig, customerApprovalRequired: e.target.checked },
                  })
                }
                className="rounded text-purple-600"
              />
              <span className="font-bold text-[#14213D]">PPAP Required</span>
            </label>
          </div>
        </div>

        {/* Critical Quality Parameters Tag Selector */}
        <div className="space-y-2 pt-2">
          <span className="text-xs font-bold text-[#14213D] block">Critical Quality Parameters (CQP)</span>
          <div className="flex flex-wrap gap-2">
            {ALL_PARAMS.map((param) => {
              const isChecked = qualityConfig.criticalParams.includes(param);
              return (
                <button
                  key={param}
                  type="button"
                  onClick={() => toggleParam(param)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1.5 transition-colors ${
                    isChecked
                      ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                      : 'bg-white border-[#E4E0D6] text-gray-600 hover:border-gray-400'
                  }`}
                >
                  <Tag className="w-3 h-3 text-blue-600" />
                  {param}
                  {isChecked && <CheckCircle2 className="w-3 h-3 text-blue-600 ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 2: Attached Engineering Documents */}
      <div className="bg-white border border-[#E4E0D6] rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-2">
          <h4 className="text-xs font-bold text-[#14213D] uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-[#E8622C]" />
            Attached Engineering Documents &amp; Drawings
          </h4>
          <span className="text-xs text-gray-500 font-mono font-semibold">
            {documents.length} attachment{documents.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Drag and Drop Simulator Area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleSimulateUpload('Product Drawing', '2D_Part_Drawing_RevB.pdf');
          }}
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
            dragOver ? 'border-[#E8622C] bg-orange-50/50' : 'border-[#E4E0D6] bg-[#F9F8F5]'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-white border border-[#E4E0D6] text-gray-600 flex items-center justify-center mx-auto mb-2 shadow-xs">
            <Upload className="w-4 h-4 text-[#E8622C]" />
          </div>
          <p className="text-xs font-bold text-[#14213D]">
            Drag &amp; drop 2D/3D part drawings, mold setup sheets, or packaging specs here
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">Supports PDF, DXF, STEP, PNG, DOCX up to 50MB</p>

          <div className="flex items-center justify-center gap-2 mt-3">
            <button
              type="button"
              onClick={() => handleSimulateUpload('Product Drawing', '2D_Part_Drawing_RevB.pdf')}
              className="btn btn-xs btn-ghost border-[#E4E0D6] text-[11px]"
            >
              + Attach Part Drawing
            </button>
            <button
              type="button"
              onClick={() => handleSimulateUpload('Mold Setup Sheet', 'Mold_Setup_Sheet_4Cav.pdf')}
              className="btn btn-xs btn-ghost border-[#E4E0D6] text-[11px]"
            >
              + Mold Setup Sheet
            </button>
            <button
              type="button"
              onClick={() => handleSimulateUpload('Packaging Spec', 'Master_Carton_Pack_Spec.pdf')}
              className="btn btn-xs btn-ghost border-[#E4E0D6] text-[11px]"
            >
              + Packaging Spec
            </button>
          </div>
        </div>

        {/* Documents Table */}
        {documents.length === 0 ? (
          /* Empty State with exact requested copy */
          <div className="text-center py-6 px-4 bg-[#F9F8F5] rounded-xl border border-[#E4E0D6] text-xs text-gray-500">
            No documents attached. Attach drawings, setup sheets, packaging specs, or approval files.
          </div>
        ) : (
          <div className="overflow-x-auto border border-[#E4E0D6] rounded-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F6F4EF] text-[#14213D] border-b border-[#E4E0D6] font-semibold text-[11px]">
                  <th className="py-2 px-3">Document Name</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Version</th>
                  <th className="py-2 px-3">Effective Date</th>
                  <th className="py-2 px-3 text-center">Required for Release</th>
                  <th className="py-2 px-3 text-center w-16">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="py-2 px-3 font-semibold text-[#14213D] flex items-center gap-2">
                      <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                      {doc.name}
                      <span className="text-[10px] text-gray-400 font-mono">({doc.fileSize})</span>
                    </td>
                    <td className="py-2 px-3 text-gray-600">{doc.type}</td>
                    <td className="py-2 px-3 font-mono">{doc.version}</td>
                    <td className="py-2 px-3 font-mono text-gray-600">{doc.effectiveDate}</td>
                    <td className="py-2 px-3 text-center">
                      {doc.requiredForRelease ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Mandatory Gate
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400">Optional</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveDoc(doc.id)}
                        className="p-1 text-gray-400 hover:text-rose-600"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
