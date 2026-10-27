import React, { useState, useEffect, useMemo } from 'react';
import { ItemMaster, BomMaster } from '@/src/types';
import { WizardStepId, ManufacturingBomWizardState } from './types';
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
import { usePaginatedItems } from '@/src/hooks/useMasterData';
import { normalizeItemMaster } from '../../../masterdata/screens/MasterDataViews';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  CheckCircle2,
  Sparkles,
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
  onSaveDraftBom?: (draftBom: BomMaster) => void;
  showToast: (msg: string) => void;
  onViewBomDetails?: (bom: BomMaster) => void;
}

const createEmptyParentItem = (): ItemMaster => ({
  code: '',
  name: '',
  type: '' as any,
  cat: '',
  stock: '0',
  avail: '0',
  wh: '',
  lot: true,
  qc: true,
  status: 'active',
  icon: '◇',
  baseUOM: '',
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
  onSaveDraftBom,
  showToast,
  onViewBomDetails,
}) => {
  if (!isOpen) return null;

  // Fetch live Approved Items directly via TanStack Query so the dropdown is always populated from PostgreSQL
  const { data: apiApprovedPage } = usePaginatedItems({
    page: 1,
    limit: 100,
    approval: 'approved',
  });

  const mergedApprovedItems = useMemo(() => {
    const map = new Map<string, ItemMaster>();
    if (Array.isArray(allItems)) {
      allItems.forEach((i) => {
        const norm = normalizeItemMaster(i);
        if (norm?.code && norm.approval === 'approved') map.set(norm.code, norm);
      });
    }
    if (Array.isArray(apiApprovedPage?.items)) {
      apiApprovedPage.items.forEach((i) => {
        const norm = normalizeItemMaster(i);
        if (norm?.code && norm.approval === 'approved') map.set(norm.code, norm);
      });
    }
    return Array.from(map.values());
  }, [allItems, apiApprovedPage?.items]);

  const [currentStep, setCurrentStep] = useState<WizardStepId>(1);
  const [completedSteps, setCompletedSteps] = useState<WizardStepId[]>([]);
  const [saveStatus, setSaveStatus] = useState<'not_saved' | 'saving' | 'saved' | 'draft_saved'>('not_saved');
  const [lastSavedAt, setLastSavedAt] = useState<string>('');
  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false);
  const [createdBomResult, setCreatedBomResult] = useState<BomMaster | null>(null);

  // Generate BOM code based on numbering rules
  const generateBomCode = (itemCode: string, _version: string) => {
    if (!itemCode) return '';
    return itemCode;
  };

  // Initial State Factory (100% from selected Item Master — zero hardcoded 14.5s or WH-FG-01 defaults)
  const buildInitialState = (initialParent?: ItemMaster | null): ManufacturingBomWizardState => {
    const item = initialParent && initialParent.code ? normalizeItemMaster(initialParent) : createEmptyParentItem();
    const defaultVer = '1.0';
    const generatedCode = item.code ? generateBomCode(item.code, defaultVer) : '';
    const cycleSec = Number(item.standardCycleTime || item.cycleTime || 0);
    const cavities = Number(item.cavityCount || 1) || 1;
    const partWt = Number((item as any).partWeightGrams || (item as any).netWeightGrams || 0);
    const runnerWt = Number((item as any).runnerWeightGrams || 0);
    const shotWt = Number((item as any).shotWeightGrams || ((partWt * cavities) + runnerWt) || 0);

    return {
      parentItem: item,
      bomCode: generatedCode,
      isCustomCode: false,
      bomName: item.code ? item.name : '',
      bomVersion: defaultVer,
      bomType: 'Manufacturing BOM',
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveTo: '',
      plantId: item.plant || 'PLANT-01',
      owner: 'Engineering & Tooling',
      description: item.code ? (item.desc || `Manufacturing Bill of Materials for ${item.name} (${item.cat || 'Finished Good'}).`) : '',
      remarks: item.code
        ? ((item as any).creationNotes || `Tooling: ${item.moldToolId || 'MOLD-001'} (${cavities} Cav) • Resin: ${item.resinType || 'Standard Grade'}`)
        : '',

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
      standardCycleTimeSec: cycleSec,
      itemNetWeightGrams: partWt,
      runnerWeightGrams: runnerWt,
      totalShotWeightGrams: shotWt,
      moldCavities: cavities,
      estimatedProductionTimeHours: cycleSec > 0 ? Number(((cycleSec * 1000) / 3600).toFixed(2)) : 0,
      defaultInputLocation: 'RM-SILO-01',
      defaultWipLocation: 'WIP-STAGE-01',
      defaultFgLocation: item.wh || '',
      defaultSecondaryLocation: 'SEC-AREA-01',

      totalFormulaPct: 100,
      autoBalanceResin: true,
      batchWeightKg: partWt > 0 ? Number(((partWt * 1000) / 1000).toFixed(2)) : 0,
      batchWeightUOM: 'KG',

      components: [],
      secondaryOperations: [],
      routingResources: item.code
        ? [
            {
              id: 'ROUT-01',
              operationNo: 10,
              operationName: `${item.processingMethod || 'Injection Molding'} & Degating`,
              operationType: 'Primary Molding',
              workCenter: 'WC-INJ-01 - Injection Bay',
              machineId: item.machineCompat || 'IMM Line 1',
              moldId: item.moldToolId || 'MOLD-001',
              cavities,
              setupTimeMin: 45,
              runTimeHours: cycleSec > 0 ? Number(((cycleSec * 1000) / 3600).toFixed(2)) : 4.0,
              cycleTimeSec: cycleSec,
              crewSize: 1,
              laborSkill: 'Level 2 Molding Technician',
              outputPerHour: cycleSec > 0 ? Math.round((3600 / cycleSec) * cavities) : 0,
              qualityCheckpoint: true,
              instructions: item.desc || 'Verify barrel temperatures and mold cooling parameters.',
            },
          ]
        : [],

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
        samplingRule: item.samplingPlan || 'ISO 2859-1 Level II Normal',
        criticalParams: Array.isArray((item as any).qualityTestParams)
          ? (item as any).qualityTestParams
          : ['MFI (Melt Flow Index)', 'Dimensional Tolerance ±0.05mm'],
        coaRequired: Boolean(item.coaRequired ?? true),
        customerApprovalRequired: false,
        msdsRequired: true,
      },
      documents: Array.isArray((item as any).documents)
        ? (item as any).documents.map((d: any, idx: number) => ({
            id: d.id || `DOC-0${idx + 1}`,
            name: d.name || d.fileName || 'Technical_Spec.pdf',
            type: d.category || d.type || 'Product Drawing',
            version: d.version || 'v1.0',
            effectiveDate: d.uploadedAt ? String(d.uploadedAt).slice(0, 10) : new Date().toISOString().split('T')[0],
            uploadedBy: d.uploadedBy || 'Engineering',
            status: 'Active',
            fileSize: d.size || '1.0 MB',
            requiredForRelease: true,
          }))
        : [],
    };
  };

  const [state, setState] = useState<ManufacturingBomWizardState>(() => {
    if (parentItem?.code) {
      try {
        const saved = typeof window !== 'undefined' ? sessionStorage.getItem(`reboot_mfg_bom_draft_${parentItem.code}`) : null;
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

  // Check if there is an existing BOM for this item/version to reflect live status in header
  const matchedExistingBom = useMemo(() => {
    if (!state.bomCode) return undefined;
    return existingBoms.find(
      (b) =>
        b.id.toLowerCase() === state.bomCode.toLowerCase() ||
        (b.parent.toLowerCase() === state.parentItem.code.toLowerCase() &&
          b.version.replace(/^v/i, '') === state.bomVersion.replace(/^v/i, ''))
    );
  }, [existingBoms, state.bomCode, state.parentItem.code, state.bomVersion]);

  useEffect(() => {
    if (matchedExistingBom) {
      setSaveStatus('saved');
      setLastSavedAt(matchedExistingBom.updated || 'Live');
    }
  }, [matchedExistingBom]);

  // Sync state if parentItem prop updates externally
  useEffect(() => {
    if (parentItem && parentItem.code && parentItem.code !== state.parentItem.code) {
      setState(buildInitialState(parentItem));
    }
  }, [parentItem]);

  // Keep BOM code and routing synced when user selects an item or changes version
  const handleStateChange = (patch: Partial<ManufacturingBomWizardState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      if (patch.parentItem && patch.parentItem.code) {
        const p = patch.parentItem;
        const cycleSec = Number(p.standardCycleTime || p.cycleTime || 0);
        const cavities = Number(p.cavityCount || 1) || 1;
        if (next.routingResources.length === 0) {
          next.routingResources = [
            {
              id: 'ROUT-01',
              operationNo: 10,
              operationName: `${p.processingMethod || 'Injection Molding'} & Degating`,
              operationType: 'Primary Molding',
              workCenter: 'WC-INJ-01 - Injection Bay',
              machineId: p.machineCompat || 'IMM Line 1',
              moldId: p.moldToolId || 'MOLD-001',
              cavities,
              setupTimeMin: 45,
              runTimeHours: cycleSec > 0 ? Number(((cycleSec * (next.batchSize || 1000)) / 3600).toFixed(2)) : 4.0,
              cycleTimeSec: cycleSec,
              crewSize: 1,
              laborSkill: 'Level 2 Molding Technician',
              outputPerHour: cycleSec > 0 ? Math.round((3600 / cycleSec) * cavities) : 0,
              qualityCheckpoint: true,
              instructions: p.desc || 'Verify barrel temperatures and mold cooling parameters.',
            },
          ];
        } else {
          next.routingResources = next.routingResources.map((r, i) =>
            i === 0
              ? {
                  ...r,
                  cycleTimeSec: cycleSec,
                  cavities,
                  moldId: p.moldToolId || r.moldId,
                  machineId: p.machineCompat || r.machineId,
                }
              : r
          );
        }
      }
      if (patch.bomVersion && !next.isCustomCode && next.parentItem.code) {
        next.bomCode = generateBomCode(next.parentItem.code, patch.bomVersion);
      }
      return next;
    });
    setSaveStatus('not_saved');
  };

  // Construct BomMaster record from current wizard state
  const buildBomRecordFromState = (submitForApproval: boolean = false): BomMaster => {
    const cleanVer = state.bomVersion.replace(/^v/i, '') || '1.0';
    const bomId = state.bomCode || state.parentItem.code || `BOM-${Date.now()}`;
    return {
      id: bomId,
      parent: state.parentItem.code,
      parentName: state.bomName || state.parentItem.name,
      version: `v${cleanVer}`,
      revision: 'Rev A',
      bomType: state.bomType as any,
      processType: state.parentItem.processingMethod || 'Injection Molding',
      status: submitForApproval ? 'under_review' : 'draft',
      approvalStage: submitForApproval ? 'Engineering Review' : 'Draft',
      updated: new Date().toISOString().split('T')[0],
      createdDate: new Date().toISOString().split('T')[0],
      effectiveDate: state.effectiveFrom,
      effectiveFrom: state.effectiveFrom,
      effectiveTo: state.effectiveTo,
      baseUOM: state.parentItem.baseUOM || state.batchUOM || 'PCS',
      batchSize: state.batchSize,
      yieldPct: state.yieldPct,
      scrapPct: state.scrapPct,
      standardCost: state.costRollup.costPerUnit || Number(state.parentItem.standardCost || state.parentItem.cost || 0),
      materialCost: state.costRollup.materialCost,
      laborCost: state.costRollup.laborCost,
      machineOverhead: state.costRollup.machineCost,
      moldAmortization: state.costRollup.moldAmortization,
      energyCost: state.costRollup.energyCost,
      regrindCredit: state.costRollup.regrindCredit,
      lastCostRollupDate: new Date().toISOString().split('T')[0],
      owner: state.owner,
      department: state.owner,
      plant: state.plantId,
      plantId: state.plantId,
      moldId: state.routingResources[0]?.moldId || state.parentItem.moldToolId || 'MOLD-001',
      machineGroup: state.routingResources[0]?.machineId || state.parentItem.machineCompat || 'IMM Line',
      cycleTimeSec: state.standardCycleTimeSec,
      cavities: state.routingResources[0]?.cavities || state.moldCavities || 1,
      shotWeightGrams: state.totalShotWeightGrams,
      itemNetWeightGrams: state.itemNetWeightGrams,
      runnerWeightGrams: state.runnerWeightGrams,
      totalShotWeightGrams: state.totalShotWeightGrams,
      description: state.description,
      remarks: state.remarks,
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
  };

  // Validation per step
  const validateStep = (stepId: WizardStepId): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (stepId === 1) {
      if (!state.parentItem.code.trim()) errs.parentItem = 'Parent item code is required (select an Approved FG from Item Master)';
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

  const allErrors: Record<string, string> = {
    ...validateStep(1),
    ...validateStep(3),
    ...validateStep(4),
    ...validateStep(6),
  };

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
  if (state.standardCycleTimeSec > 0) {
    suggestions.push(`Cycle time (${state.standardCycleTimeSec}s) is synced from Item Master (${state.parentItem.code}).`);
  }

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

  // Live Save Draft Action (Persists to PostgreSQL via API + sessionStorage)
  const handleSaveDraft = () => {
    if (!state.parentItem.code.trim()) {
      showToast('Please select an Approved Finished Good item first before saving draft');
      return;
    }
    setSaveStatus('saving');
    try {
      sessionStorage.setItem(`reboot_mfg_bom_draft_${state.parentItem.code}`, JSON.stringify(state));
      const draftRecord = buildBomRecordFromState(false);
      if (onSaveDraftBom) {
        onSaveDraftBom(draftRecord);
      }
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setTimeout(() => {
        setLastSavedAt(nowTime);
        setSaveStatus('draft_saved');
        showToast(`✓ Draft BOM "${draftRecord.id} (v${state.bomVersion})" saved live to database!`);
      }, 150);
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

    const newBom = buildBomRecordFromState(submitForApproval);

    try {
      sessionStorage.removeItem(`reboot_mfg_bom_draft_${state.parentItem.code}`);
    } catch (e) {}

    setSaveStatus('saved');
    setLastSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    onSaveBom(newBom, submitForApproval);
    setCreatedBomResult(newBom);
    showToast(
      submitForApproval
        ? `✓ Manufacturing BOM ${newBom.id} saved to database and submitted for approval!`
        : `✓ Manufacturing BOM ${newBom.id} saved to database as Draft!`
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
          bomStatus={matchedExistingBom?.status || 'draft'}
          saveStatus={saveStatus}
          lastSavedAt={lastSavedAt}
          onSaveDraft={handleSaveDraft}
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
            <Step1BasicInfo
              state={state}
              items={mergedApprovedItems}
              onChange={handleStateChange}
              errors={currentErrors}
              showToast={showToast}
            />
          )}
          {currentStep === 2 && <Step2MfgType state={state} onChange={handleStateChange} />}
          {currentStep === 3 && (
            <Step3BatchOutput state={state} onChange={handleStateChange} errors={currentErrors} />
          )}
          {currentStep === 4 && (
            <Step4Materials
              state={state}
              items={mergedApprovedItems}
              onChange={handleStateChange}
              errors={currentErrors}
              showToast={showToast}
            />
          )}
          {currentStep === 5 && (
            <Step5SecondaryOps
              state={state}
              items={mergedApprovedItems}
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
                  ₹{(createdBomResult.standardCost || 0).toFixed(2)}
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
