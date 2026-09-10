import React, { useState, useEffect } from 'react';
import { ItemMaster, BomMaster, BomLine } from '../../../types';
import { WizardStepId, ManufacturingBomWizardState, WIZARD_STEPS } from './types';
import { WizardHeader } from './WizardHeader';
import { WizardStepper } from './WizardStepper';
import { Step1BasicInfo } from './Step1BasicInfo';
import { Step2MfgType } from './Step2MfgType';
import { Step3BatchOutput } from './Step3BatchOutput';
import { Step4Materials } from './Step4Materials';
import { Step5SecondaryOps } from './Step5SecondaryOps';
import { Step6RoutingResources } from './Step6RoutingResources';
import { Step7ScrapCost } from './Step7ScrapCost';
import { Step8QualityDocs } from './Step8QualityDocs';
import { Step9ReviewFinish } from './Step9ReviewFinish';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  CheckCircle2,
  X,
  FileCheck,
  RotateCcw,
  Sparkles,
  Layers,
  Eye,
  Plus,
} from 'lucide-react';

interface ManufacturingBomWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentItem?: ItemMaster | null;
  allItems: ItemMaster[];
  existingBoms?: BomMaster[];
  onSaveBom: (newBom: BomMaster, submitForApproval?: boolean) => void;
  showToast: (msg: string) => void;
  onViewBomDetails?: (bom: BomMaster) => void;
}

const createEmptyParentItem = (): ItemMaster => ({
  code: '',
  name: '',
  type: 'Finished Good',
  cat: '',
  stock: '0',
  avail: '0',
  wh: '',
  lot: true,
  qc: true,
  status: 'active',
  icon: '◇',
  baseUOM: 'PCS',
  approval: 'approved',
  createdOn: new Date().toISOString().split('T')[0],
});

export const ManufacturingBomWizardModal: React.FC<ManufacturingBomWizardModalProps> = ({
  isOpen,
  onClose,
  parentItem,
  allItems,
  existingBoms = [],
  onSaveBom,
  showToast,
  onViewBomDetails,
}) => {
  if (!isOpen) return null;

  const [currentStep, setCurrentStep] = useState<WizardStepId>(1);
  const [completedSteps, setCompletedSteps] = useState<WizardStepId[]>([]);
  const [saveStatus, setSaveStatus] = useState<'not_saved' | 'saving' | 'saved' | 'draft_saved'>('not_saved');
  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false);
  const [createdBomResult, setCreatedBomResult] = useState<BomMaster | null>(null);

  // Generate initial BOM code based on numbering rules
  const generateBomCode = (itemCode: string, version: string) => {
    if (!itemCode) return '';
    const cleanVer = version.replace(/^v/i, '') || '1.0';
    return `BOM-${itemCode}-V${cleanVer}`;
  };

  // Initial State Factory
  const buildInitialState = (initialParent?: ItemMaster | null): ManufacturingBomWizardState => {
    const item = initialParent && initialParent.code ? initialParent : createEmptyParentItem();
    const defaultVer = '1.0';
    const generatedCode = item.code ? generateBomCode(item.code, defaultVer) : '';

    return {
      parentItem: item,
      bomCode: generatedCode,
      isCustomCode: false,
      bomName: item.code ? `${item.name} Molded & Assembled BOM` : '',
      bomVersion: defaultVer,
      bomType: 'Manufacturing BOM',
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveTo: '',
      plantId: 'PLANT-01',
      owner: 'Engineering & Tooling',
      description: item.code ? `Standard manufacturing bill of materials for ${item.name}.` : '',
      remarks: 'Validated for high-speed automated robotic take-out cycle.',

      mfgCategory: 'Discrete Manufacturing BOM',
      multiLevelEnabled: false,
      allowSubstitutes: true,
      allowRegrind: true,
      requireQualityInspection: true,
      requireCustomerApproval: false,
      autoCreateSecondaryWO: false,

      batchSize: 1000,
      batchUOM: item.baseUOM || 'PCS',
      outputQty: 1000,
      expectedFinishedQty: 985,
      expectedScrapQty: 15,
      yieldPct: 98.5,
      scrapPct: 1.5,
      cycleTimeSource: 'Item Master',
      standardCycleTimeSec: item.standardCycleTime || 14.5,
      estimatedProductionTimeHours: Number((((item.standardCycleTime || 14.5) * 1000) / 3600).toFixed(2)),
      defaultInputLocation: 'RM-SILO-01',
      defaultWipLocation: 'WIP-STAGE-01',
      defaultFgLocation: item.wh || 'FG-WH1-B02',
      defaultSecondaryLocation: 'SEC-AREA-01',

      totalFormulaPct: 100,
      autoBalanceResin: true,
      batchWeightKg: 46.8,
      batchWeightUOM: 'KG',

      // Start with empty components list - no default BOM items
      components: [],
      secondaryOperations: [],
      routingResources: [
        {
          id: 'ROUT-01',
          operationNo: 10,
          operationName: 'High-Speed Injection Molding & Degating',
          operationType: 'Primary Molding',
          workCenter: 'WC-INJ-01 - 250T Injection Bay',
          machineId: 'IMM 250T - Line 1 (Engel)',
          moldId: 'MOLD-INJ-084 (4-Cavity Hot Runner)',
          cavities: 4,
          setupTimeMin: 45,
          runTimeHours: 4.0,
          cycleTimeSec: 14.5,
          crewSize: 1,
          laborSkill: 'Level 2 Molding Technician',
          outputPerHour: 993,
          qualityCheckpoint: true,
          instructions: 'Maintain barrel temp zone 1-4 at 210C-235C. Verify chilling water delta T < 1.5C.',
        },
      ],

      scrapConfig: {
        standardYieldPct: 98.5,
        expectedScrapPct: 1.5,
        startupScrapKg: 12.0,
        processWastePct: 0.8,
        purgingMaterialKg: 5.0,
        runnerScrapCategory: 'Runner Scrap - Granulated',
        lumbesScrapCategory: 'Purge Lumps - Re-shredded',
        reworkAllowed: true,
        regridRecoveryAllowed: true,
        maxRegrindPct: 15,
      },
      materialPriceSource: 'Standard price',
      laborRatePerHour: 22.0,
      machineRatePerHour: 45.0,
      overheadRatePerHour: 15.0,
      regrindCreditRatePerKg: 1.2,
      costPreviewRan: false,
      costRollup: {
        materialCost: 0,
        packagingCost: 0,
        secondaryOpCost: 0.0,
        laborCost: 0,
        machineCost: 0,
        moldAmortization: 0,
        energyCost: 0,
        scrapCost: 0,
        regrindCredit: 0,
        totalCost: 0,
        costPerUnit: 0,
        costPerBatch: 0,
        costPerKg: 0,
      },

      qualityConfig: {
        qualityInspectionRequired: true,
        incomingInspectionRequired: true,
        inProcessInspectionRequired: true,
        finalInspectionRequired: true,
        secondaryInspectionRequired: false,
        inspectionPlanId: 'INSP-PLAN-INJ-01',
        samplingRule: 'AQL 1.0 General Inspection Level II',
        criticalParams: [
          'MFI (Melt Flow Index)',
          'Dimensional Tolerance ±0.05mm',
          'Color Delta-E < 0.8',
          'Wall Thickness Uniformity',
        ],
        coaRequired: true,
        customerApprovalRequired: false,
        msdsRequired: true,
      },
      documents: [
        {
          id: 'DOC-01',
          name: 'Part_Engineering_Drawing_RevB.pdf',
          type: 'Product Drawing',
          version: 'v2.1',
          effectiveDate: '2026-07-01',
          uploadedBy: 'Priya Rao',
          status: 'Active',
          fileSize: '3.4 MB',
          requiredForRelease: true,
        },
      ],
    };
  };

  const [state, setState] = useState<ManufacturingBomWizardState>(() => {
    // Check localStorage for saved draft
    if (parentItem?.code) {
      try {
        const saved = localStorage.getItem(`reboot_mfg_bom_draft_${parentItem.code}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          return { ...buildInitialState(parentItem), ...parsed };
        }
      } catch (e) {
        console.warn('Draft parsing error', e);
      }
    }
    return buildInitialState(parentItem);
  });

  // Sync state if parentItem prop updates externally
  useEffect(() => {
    if (parentItem && parentItem.code && parentItem.code !== state.parentItem.code) {
      const defaultVer = state.bomVersion || '1.0';
      setState((prev) => ({
        ...prev,
        parentItem,
        bomCode: prev.isCustomCode ? prev.bomCode : generateBomCode(parentItem.code, defaultVer),
        bomName: prev.bomName || `${parentItem.name} Molded & Assembled BOM`,
        description: prev.description || `Standard manufacturing bill of materials for ${parentItem.name}.`,
        batchUOM: parentItem.baseUOM || prev.batchUOM,
        defaultFgLocation: parentItem.wh || prev.defaultFgLocation,
      }));
    }
  }, [parentItem]);

  // Keep BOM code synced if user changes version and not custom
  const handleStateChange = (patch: Partial<ManufacturingBomWizardState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      if (patch.bomVersion && !next.isCustomCode && next.parentItem.code) {
        next.bomCode = generateBomCode(next.parentItem.code, patch.bomVersion);
      }
      return next;
    });
    setSaveStatus('not_saved');
  };

  // Autosave draft every 30 seconds
  useEffect(() => {
    if (!state.parentItem?.code) return;
    const timer = setInterval(() => {
      try {
        localStorage.setItem(`reboot_mfg_bom_draft_${state.parentItem.code}`, JSON.stringify(state));
        setSaveStatus('draft_saved');
      } catch (e) {
        // silent fail
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [state]);

  // Validation per step
  const validateStep = (stepId: WizardStepId): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (stepId === 1) {
      if (!state.parentItem.code.trim()) errs.parentItem = 'Parent item code is required (select from Item Master)';
      if (!state.bomCode.trim()) errs.bomCode = 'BOM code is required';
      if (!state.bomName.trim()) errs.bomName = 'BOM name is required';
      if (!state.bomVersion.trim()) errs.bomVersion = 'BOM version is required';
      if (!state.effectiveFrom) errs.effectiveFrom = 'Effective from date is required';
    } else if (stepId === 3) {
      if (state.batchSize <= 0) errs.batchSize = 'Batch size must be greater than 0';
    } else if (stepId === 4) {
      if (state.components.length === 0) errs.components = 'At least 1 raw material or component is required';
    } else if (stepId === 6) {
      if (state.routingResources.length === 0) errs.routing = 'At least 1 routing operation step is required';
    }
    return errs;
  };

  const currentErrors = validateStep(currentStep);

  // Overall validation issues for review step
  const allErrors: Record<string, string> = {
    ...validateStep(1),
    ...validateStep(3),
    ...validateStep(4),
    ...validateStep(6),
  };

  // Warnings & suggestions for Step 9
  const warnings: string[] = [];
  if (state.documents.length === 0) {
    warnings.push('No product drawing or quality spec attached. Documents may be required before final release.');
  }
  if (!state.allowRegrind) {
    warnings.push('Regrind usage is disabled. Plastic runner scrap will not be credited back to production costs.');
  }

  const suggestions: string[] = [];
  if (state.components.some((c) => c.category === 'Virgin Resin') && state.scrapConfig.regridRecoveryAllowed) {
    suggestions.push('Regrind allowance is enabled (15%). Ensure moisture desiccant drying is specified in operator instructions.');
  }
  suggestions.push('Cycle time is verified against mold cooling requirements (14.5 seconds).');

  // Next step transition
  const handleNextStep = () => {
    const errs = validateStep(currentStep);
    if (Object.keys(errs).length > 0) {
      showToast('Please correct the highlighted fields before proceeding');
      return;
    }
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps((prev) => [...prev, currentStep]);
    }
    if (currentStep < 9) {
      setCurrentStep((prev) => (prev + 1) as WizardStepId);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStepId);
    }
  };

  // Save draft action
  const handleSaveDraft = () => {
    setSaveStatus('saving');
    try {
      localStorage.setItem(`reboot_mfg_bom_draft_${parentItem.code}`, JSON.stringify(state));
      setTimeout(() => {
        setSaveStatus('draft_saved');
        showToast(`Draft BOM for ${parentItem.code} saved to local workspace`);
      }, 300);
    } catch (e) {
      setSaveStatus('not_saved');
    }
  };

  // Final Create BOM action
  const handleFinalCreateBom = (submitForApproval: boolean = false) => {
    if (Object.keys(allErrors).length > 0) {
      showToast('Cannot release BOM: please resolve blocking validation errors');
      setCurrentStep(9);
      return;
    }

    const newBom: BomMaster = {
      id: state.bomCode,
      parent: state.parentItem.code,
      parentName: state.parentItem.name,
      version: `v${state.bomVersion}`,
      revision: 'Rev A',
      bomType: state.bomType,
      processType: 'Injection Molding',
      status: submitForApproval ? 'under_review' : 'draft',
      approvalStage: submitForApproval ? 'Engineering Review' : 'Draft',
      updated: new Date().toISOString().split('T')[0],
      createdDate: new Date().toISOString().split('T')[0],
      effectiveFrom: state.effectiveFrom,
      effectiveTo: state.effectiveTo,
      baseUOM: state.parentItem.baseUOM || 'PCS',
      batchSize: state.batchSize,
      yieldPct: state.yieldPct,
      scrapPct: state.scrapPct,
      standardCost: state.costRollup.costPerUnit,
      materialCost: state.costRollup.materialCost,
      laborCost: state.costRollup.laborCost,
      machineOverhead: state.costRollup.machineCost,
      moldAmortization: state.costRollup.moldAmortization,
      energyCost: state.costRollup.energyCost,
      regrindCredit: state.costRollup.regrindCredit,
      lastCostRollupDate: new Date().toISOString().split('T')[0],
      owner: state.owner,
      plantId: state.plantId,
      moldId: state.routingResources[0]?.moldId || 'MOLD-01',
      machineGroup: state.routingResources[0]?.machineId || 'IMM Line',
      cycleTimeSec: state.standardCycleTimeSec,
      cavities: state.routingResources[0]?.cavities || 4,
      notes: state.remarks || state.description,
      mfgCategory: state.mfgCategory,
      secondaryOperations: state.secondaryOperations,
      routingResources: state.routingResources,
      scrapConfig: state.scrapConfig,
      qualityConfig: state.qualityConfig,
      defaultInputLocation: state.defaultInputLocation,
      defaultWipLocation: state.defaultWipLocation,
      defaultFgLocation: state.defaultFgLocation,
      defaultSecondaryLocation: state.defaultSecondaryLocation,
      lines: state.components,
      documents: state.documents,
      approvals: [
        {
          stage: 'Creation',
          approver: state.owner,
          role: 'Lead Tooling Engineer',
          status: 'Approved',
          timestamp: new Date().toISOString(),
        },
      ],
    };

    // Clean up local draft
    try {
      localStorage.removeItem(`reboot_mfg_bom_draft_${parentItem.code}`);
    } catch (e) {}

    onSaveBom(newBom, submitForApproval);
    setCreatedBomResult(newBom);
    showToast(
      submitForApproval
        ? `Manufacturing BOM ${newBom.id} created and submitted for approval!`
        : `Manufacturing BOM ${newBom.id} created successfully as Draft!`
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-xs">
      <div className="bg-[#FBFBFA] rounded-2xl max-w-6xl w-full h-[94vh] flex flex-col shadow-2xl border border-[#E4E0D6] overflow-hidden">
        {/* Wizard Header */}
        <WizardHeader
          parentItem={state.parentItem}
          bomCode={state.bomCode}
          bomVersion={state.bomVersion}
          saveStatus={saveStatus}
          onClose={() => setShowCancelConfirm(true)}
        />

        {/* 9-step Navigation Stepper */}
        <WizardStepper
          currentStep={currentStep}
          completedSteps={completedSteps}
          stepErrors={{
            1: Object.keys(validateStep(1)).length,
            3: Object.keys(validateStep(3)).length,
            4: Object.keys(validateStep(4)).length,
            6: Object.keys(validateStep(6)).length,
          }}
          onStepClick={(step) => setCurrentStep(step)}
        />

        {/* Scrollable Step Workspace Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {currentStep === 1 && (
            <Step1BasicInfo state={state} items={allItems} onChange={handleStateChange} errors={currentErrors} />
          )}
          {currentStep === 2 && <Step2MfgType state={state} onChange={handleStateChange} />}
          {currentStep === 3 && (
            <Step3BatchOutput state={state} onChange={handleStateChange} errors={currentErrors} />
          )}
          {currentStep === 4 && (
            <Step4Materials
              state={state}
              items={allItems}
              onChange={handleStateChange}
              errors={currentErrors}
              showToast={showToast}
            />
          )}
          {currentStep === 5 && (
            <Step5SecondaryOps
              state={state}
              items={allItems}
              onChange={handleStateChange}
              showToast={showToast}
            />
          )}
          {currentStep === 6 && (
            <Step6RoutingResources
              state={state}
              onChange={handleStateChange}
              showToast={showToast}
            />
          )}
          {currentStep === 7 && (
            <Step7ScrapCost state={state} onChange={handleStateChange} showToast={showToast} />
          )}
          {currentStep === 8 && (
            <Step8QualityDocs state={state} onChange={handleStateChange} showToast={showToast} />
          )}
          {currentStep === 9 && (
            <Step9ReviewFinish
              state={state}
              onJumpToStep={(step) => setCurrentStep(step)}
              errors={allErrors}
              warnings={warnings}
              suggestions={suggestions}
            />
          )}
        </div>

        {/* Wizard Bottom Footer Actions */}
        <div className="bg-white border-t border-[#E4E0D6] px-6 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCancelConfirm(true)}
              className="btn btn-sm btn-ghost text-xs text-gray-500 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              className="btn btn-sm btn-ghost border-[#E4E0D6] text-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5 text-blue-600" /> Save Draft
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={currentStep === 1}
              onClick={handlePrevStep}
              className="btn btn-sm btn-ghost border-[#E4E0D6] text-xs flex items-center gap-1.5 disabled:opacity-30"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>

            {currentStep < 9 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="btn btn-sm btn-primary text-xs flex items-center gap-1.5 shadow-sm"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleFinalCreateBom(false)}
                  className="btn btn-sm btn-ghost border-[#E4E0D6] text-xs font-bold"
                >
                  Create BOM (Draft)
                </button>
                <button
                  type="button"
                  onClick={() => handleFinalCreateBom(true)}
                  className="btn btn-sm btn-primary text-xs flex items-center gap-1.5 shadow-md bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Create &amp; Submit for Approval</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 border border-[#E4E0D6] shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-[#14213D]">Discard BOM Creation?</h3>
            <p className="text-xs text-gray-600">
              You have unsaved changes in this manufacturing BOM wizard. Would you like to save a draft before closing?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="btn btn-xs btn-ghost text-xs"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCancelConfirm(false);
                  onClose();
                }}
                className="btn btn-xs btn-ghost border-rose-200 text-rose-600 hover:bg-rose-50 text-xs"
              >
                Discard &amp; Exit
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSaveDraft();
                  setShowCancelConfirm(false);
                  onClose();
                }}
                className="btn btn-xs btn-primary text-xs"
              >
                Save Draft &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Confirmation Modal */}
      {createdBomResult && (
        <div className="fixed inset-0 bg-black/70 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[#E4E0D6] shadow-2xl space-y-5 text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Manufacturing BOM Created
              </span>
              <h3 className="text-lg font-bold text-[#14213D] font-['Space_Grotesk'] mt-1">
                {createdBomResult.id}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Linked to parent part{' '}
                <strong className="text-gray-800 font-mono">{createdBomResult.parent}</strong> ({createdBomResult.parentName})
              </p>
            </div>

            {/* Quick Stat Pill */}
            <div className="grid grid-cols-3 gap-2 bg-[#F9F8F5] p-3 rounded-xl border border-[#E4E0D6] text-xs">
              <div>
                <span className="text-[10px] text-gray-400 block uppercase font-semibold">Version</span>
                <span className="font-mono font-bold text-gray-800">{createdBomResult.version}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block uppercase font-semibold">Status</span>
                <span className="font-bold text-emerald-700 capitalize">{createdBomResult.status}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block uppercase font-semibold">Unit Cost</span>
                <span className="font-mono font-bold text-[#0F8B8D]">
                  ${createdBomResult.standardCost?.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const b = createdBomResult;
                  setCreatedBomResult(null);
                  onClose();
                  if (onViewBomDetails) onViewBomDetails(b);
                }}
                className="w-full sm:w-auto btn btn-sm btn-primary text-xs flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" /> Open BOM Details
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreatedBomResult(null);
                  onClose();
                }}
                className="w-full sm:w-auto btn btn-sm btn-ghost border-[#E4E0D6] text-xs"
              >
                Go to BOM List
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreatedBomResult(null);
                  setCurrentStep(1);
                  setState(buildInitialState(parentItem));
                }}
                className="w-full sm:w-auto btn btn-sm btn-ghost text-xs flex items-center justify-center gap-1 text-[#0F8B8D]"
              >
                <Plus className="w-3.5 h-3.5" /> Create Another
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
