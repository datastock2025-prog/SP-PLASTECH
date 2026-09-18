import React, { useState, useEffect } from 'react';
import { ManufacturingBomWizardState } from './types';
import { masterDataGovernanceService } from '../../../services/masterDataGovernanceService';
import { adminEventBus } from '../../../services/adminService';
import {
  DollarSign,
  TrendingDown,
  RefreshCw,
  Zap,
  Cpu,
  Users,
  Package,
  Wrench,
  Sparkles,
  Info,
  CheckCircle2,
  Sliders,
  Calculator,
  PieChart,
  Plus,
  ChevronDown,
  X,
  Check,
} from 'lucide-react';

interface Step7Props {
  state: ManufacturingBomWizardState;
  onChange: (patch: Partial<ManufacturingBomWizardState>) => void;
  showToast: (msg: string) => void;
}

export const Step7ScrapCost: React.FC<Step7Props> = ({ state, onChange, showToast }) => {
  const { scrapConfig, costRollup, components, secondaryOperations, routingResources, batchSize } = state;
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // Task 6: Master Data for Runner Scrap and Purge Lumps Categories
  const [runnerCategoriesList, setRunnerCategoriesList] = useState(
    masterDataGovernanceService.getRunnerScrapCategories()
  );
  const [purgeCategoriesList, setPurgeCategoriesList] = useState(
    masterDataGovernanceService.getPurgeLumpsCategories()
  );

  const [isRunnerDropdownOpen, setIsRunnerDropdownOpen] = useState(false);
  const [isPurgeDropdownOpen, setIsPurgeDropdownOpen] = useState(false);

  // Creation Submodals
  const [isCreateRunnerModalOpen, setIsCreateRunnerModalOpen] = useState(false);
  const [newRunnerForm, setNewRunnerForm] = useState({
    name: '',
    description: '',
    recoveryPct: 15,
  });

  const [isCreatePurgeModalOpen, setIsCreatePurgeModalOpen] = useState(false);
  const [newPurgeForm, setNewPurgeForm] = useState({
    name: '',
    description: '',
    polymerType: 'Polypropylene (PP)',
  });

  useEffect(() => {
    const unsubRunner = adminEventBus.on('RUNNER_SCRAP_SAVED', () => {
      setRunnerCategoriesList(masterDataGovernanceService.getRunnerScrapCategories());
    });
    const unsubPurge = adminEventBus.on('PURGE_LUMPS_SAVED', () => {
      setPurgeCategoriesList(masterDataGovernanceService.getPurgeLumpsCategories());
    });
    return () => {
      unsubRunner();
      unsubPurge();
    };
  }, []);

  const handleSaveNewRunnerCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRunnerForm.name.trim()) {
      showToast('Please enter a runner scrap category name');
      return;
    }
    const saved = masterDataGovernanceService.saveRunnerScrapCategory({
      name: newRunnerForm.name.trim(),
      description: newRunnerForm.description.trim(),
      recoveryPct: Number(newRunnerForm.recoveryPct) || 15,
    });
    setRunnerCategoriesList(masterDataGovernanceService.getRunnerScrapCategories());
    onChange({
      scrapConfig: {
        ...scrapConfig,
        runnerScrapCategory: saved.name,
      },
    });
    setIsCreateRunnerModalOpen(false);
    setNewRunnerForm({ name: '', description: '', recoveryPct: 15 });
    showToast(`✓ Created Runner Scrap Category "${saved.name}" in Admin Master`);
  };

  const handleSaveNewPurgeCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPurgeForm.name.trim()) {
      showToast('Please enter a purge lumps category name');
      return;
    }
    const saved = masterDataGovernanceService.savePurgeLumpsCategory({
      name: newPurgeForm.name.trim(),
      description: newPurgeForm.description.trim(),
      polymerType: newPurgeForm.polymerType.trim(),
    });
    setPurgeCategoriesList(masterDataGovernanceService.getPurgeLumpsCategories());
    onChange({
      scrapConfig: {
        ...scrapConfig,
        lumbesScrapCategory: saved.name,
      },
    });
    setIsCreatePurgeModalOpen(false);
    setNewPurgeForm({ name: '', description: '', polymerType: 'Polypropylene (PP)' });
    showToast(`✓ Created Purge Lumps Category "${saved.name}" in Admin Master`);
  };

  // Filtered lists
  const filteredRunners = runnerCategoriesList.filter((r) =>
    r.name.toLowerCase().includes((scrapConfig.runnerScrapCategory || '').toLowerCase()) ||
    r.description.toLowerCase().includes((scrapConfig.runnerScrapCategory || '').toLowerCase())
  );

  const filteredPurges = purgeCategoriesList.filter((p) =>
    p.name.toLowerCase().includes((scrapConfig.lumbesScrapCategory || '').toLowerCase()) ||
    p.description.toLowerCase().includes((scrapConfig.lumbesScrapCategory || '').toLowerCase()) ||
    p.polymerType.toLowerCase().includes((scrapConfig.lumbesScrapCategory || '').toLowerCase())
  );

  // Recalculate cost rollup engine
  const handleRunCostPreview = () => {
    setIsCalculating(true);

    setTimeout(() => {
      // 1. Material cost
      const rawMatCost = components
        .filter((c) => c.category !== 'Packaging')
        .reduce((sum, c) => sum + (c.cost || 32.5) * c.qty * (1 + (c.scrap || 1.5) / 100), 0);

      // 2. Packaging cost
      const packCost = components
        .filter((c) => c.category === 'Packaging')
        .reduce((sum, c) => sum + (c.cost || 5.0) * c.qty, 0);

      // 3. Secondary Op cost
      const secCost = secondaryOperations.reduce(
        (sum, op) => sum + (op.standardTimeMin / 60) * state.laborRatePerHour,
        0
      );

      // 4. Labor cost from routing
      const totalLaborHours = routingResources.reduce(
        (sum, r) => sum + (r.cycleTimeSec / 3600) * r.crewSize,
        0
      );
      const laborCost = totalLaborHours * state.laborRatePerHour;

      // 5. Machine overhead from routing
      const totalMachineHours = routingResources.reduce((sum, r) => sum + r.cycleTimeSec / 3600, 0);
      const machineCost = totalMachineHours * state.machineRatePerHour;

      // 6. Mold amortization ($1.25 standard)
      const moldAmort = 1.25;

      // 7. Energy cost (approx $1.80 per unit for plastic cooling/heating)
      const energyCost = 1.8;

      // 8. Scrap cost
      const scrapCost = rawMatCost * (state.scrapPct / 100);

      // 9. Regrind credit (savings if regrind allowed)
      const regrindSavings = scrapConfig.regridRecoveryAllowed
        ? -(rawMatCost * (scrapConfig.maxRegrindPct / 100) * 0.4)
        : 0;

      // Total unit cost
      const totalCostPerUnit = Number(
        (
          rawMatCost +
          packCost +
          secCost +
          laborCost +
          machineCost +
          moldAmort +
          energyCost +
          scrapCost +
          regrindSavings
        ).toFixed(2)
      );

      const totalBatchCost = Number((totalCostPerUnit * batchSize).toFixed(2));
      const costPerKg = Number((totalCostPerUnit / 0.05).toFixed(2)); // assuming standard 50g weight

      onChange({
        costPreviewRan: true,
        costRollup: {
          materialCost: Number(rawMatCost.toFixed(2)),
          packagingCost: Number(packCost.toFixed(2)),
          secondaryOpCost: Number(secCost.toFixed(2)),
          laborCost: Number(laborCost.toFixed(2)),
          machineCost: Number(machineCost.toFixed(2)),
          moldAmortization: moldAmort,
          energyCost: energyCost,
          scrapCost: Number(scrapCost.toFixed(2)),
          regrindCredit: Number(regrindSavings.toFixed(2)),
          totalCost: totalBatchCost,
          costPerUnit: totalCostPerUnit,
          costPerBatch: totalBatchCost,
          costPerKg: costPerKg,
        },
      });

      setIsCalculating(false);
      showToast('Live cost rollup recalculated successfully');
    }, 400);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      <div className="border-b border-[#E4E0D6] pb-2">
        <h3 className="text-sm font-bold text-[#14213D]">Scrap, Regrind Recovery &amp; Cost Rollup</h3>
        <p className="text-xs text-gray-500">
          Configure start-up purge waste, runner regrind recovery credits, and run a live cost simulation.
        </p>
      </div>

      {/* Section 1: Scrap & Regrind Recovery Configuration */}
      <div className="bg-white border border-[#E4E0D6] rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-2">
          <h4 className="text-xs font-bold text-[#14213D] uppercase tracking-wider flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4 text-emerald-600" />
            Scrap Categories &amp; Regrind Recovery Parameters
          </h4>
          <span className="text-xs text-gray-500">Plastic Closed-Loop Material Cycle</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="field mb-0">
            <label className="text-xs font-bold text-[#14213D] block mb-1">Start-up Scrap (KG / Run)</label>
            <input
              type="number"
              value={scrapConfig.startupScrapKg}
              onChange={(e) =>
                onChange({
                  scrapConfig: { ...scrapConfig, startupScrapKg: parseFloat(e.target.value) || 0 },
                })
              }
              className="w-full text-xs font-mono font-bold py-2 px-3 border border-[#E4E0D6] rounded-lg"
            />
          </div>

          <div className="field mb-0">
            <label className="text-xs font-bold text-[#14213D] block mb-1">Purge Material (KG / Changeover)</label>
            <input
              type="number"
              value={scrapConfig.purgingMaterialKg}
              onChange={(e) =>
                onChange({
                  scrapConfig: { ...scrapConfig, purgingMaterialKg: parseFloat(e.target.value) || 0 },
                })
              }
              className="w-full text-xs font-mono font-bold py-2 px-3 border border-[#E4E0D6] rounded-lg"
            />
          </div>

          {/* Task 6: Runner Scrap Category Autocomplete & Create */}
          <div className="field mb-0 relative">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#14213D]">Runner Scrap Category</label>
              <button
                type="button"
                onClick={() => {
                  setNewRunnerForm({
                    name: scrapConfig.runnerScrapCategory || '',
                    description: '',
                    recoveryPct: 15,
                  });
                  setIsCreateRunnerModalOpen(true);
                }}
                className="text-[10px] text-teal-700 hover:text-teal-900 font-bold flex items-center gap-0.5 hover:underline"
              >
                <Plus className="w-2.5 h-2.5" /> + Create
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={scrapConfig.runnerScrapCategory}
                onFocus={() => setIsRunnerDropdownOpen(true)}
                onChange={(e) => {
                  onChange({
                    scrapConfig: { ...scrapConfig, runnerScrapCategory: e.target.value },
                  });
                  setIsRunnerDropdownOpen(true);
                }}
                placeholder="Search or enter runner scrap..."
                className="w-full text-xs py-2 px-3 pr-7 border border-[#E4E0D6] rounded-lg"
              />
              <ChevronDown
                className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-3 pointer-events-none cursor-pointer"
                onClick={() => setIsRunnerDropdownOpen(!isRunnerDropdownOpen)}
              />
            </div>

            {isRunnerDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsRunnerDropdownOpen(false)} />
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#E4E0D6] rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                  <div className="p-1.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between text-[10px] text-gray-500 font-semibold px-2">
                    <span>Select Runner Scrap Reason</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRunnerDropdownOpen(false);
                        setNewRunnerForm({
                          name: scrapConfig.runnerScrapCategory || '',
                          description: '',
                          recoveryPct: 15,
                        });
                        setIsCreateRunnerModalOpen(true);
                      }}
                      className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-0.5"
                    >
                      <Plus className="w-2.5 h-2.5" /> + New in Admin
                    </button>
                  </div>
                  {filteredRunners.map((cat) => (
                    <div
                      key={cat.id}
                      onClick={() => {
                        onChange({
                          scrapConfig: { ...scrapConfig, runnerScrapCategory: cat.name },
                        });
                        setIsRunnerDropdownOpen(false);
                      }}
                      className="px-2.5 py-1.5 hover:bg-emerald-50 cursor-pointer text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-gray-900">{cat.name}</div>
                        <div className="text-[10px] text-gray-500 truncate max-w-[200px]">{cat.description}</div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {cat.recoveryPct}% Recovery
                      </span>
                    </div>
                  ))}
                  {filteredRunners.length === 0 && (
                    <div className="p-3 text-center text-gray-500 text-xs">
                      No matching runner scrap categories.
                      <button
                        type="button"
                        onClick={() => {
                          setIsRunnerDropdownOpen(false);
                          setNewRunnerForm({
                            name: scrapConfig.runnerScrapCategory,
                            description: '',
                            recoveryPct: 15,
                          });
                          setIsCreateRunnerModalOpen(true);
                        }}
                        className="block mx-auto mt-1.5 text-xs text-teal-700 font-bold hover:underline"
                      >
                        + Create "{scrapConfig.runnerScrapCategory}" as new Category
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Task 6: Purge Lumps Category Autocomplete & Create */}
          <div className="field mb-0 relative">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#14213D]">Purge Lumps Category</label>
              <button
                type="button"
                onClick={() => {
                  setNewPurgeForm({
                    name: scrapConfig.lumbesScrapCategory || '',
                    description: '',
                    polymerType: 'Polypropylene (PP)',
                  });
                  setIsCreatePurgeModalOpen(true);
                }}
                className="text-[10px] text-teal-700 hover:text-teal-900 font-bold flex items-center gap-0.5 hover:underline"
              >
                <Plus className="w-2.5 h-2.5" /> + Create
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={scrapConfig.lumbesScrapCategory}
                onFocus={() => setIsPurgeDropdownOpen(true)}
                onChange={(e) => {
                  onChange({
                    scrapConfig: { ...scrapConfig, lumbesScrapCategory: e.target.value },
                  });
                  setIsPurgeDropdownOpen(true);
                }}
                placeholder="Search or enter purge lumps..."
                className="w-full text-xs py-2 px-3 pr-7 border border-[#E4E0D6] rounded-lg"
              />
              <ChevronDown
                className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-3 pointer-events-none cursor-pointer"
                onClick={() => setIsPurgeDropdownOpen(!isPurgeDropdownOpen)}
              />
            </div>

            {isPurgeDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsPurgeDropdownOpen(false)} />
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#E4E0D6] rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                  <div className="p-1.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between text-[10px] text-gray-500 font-semibold px-2">
                    <span>Select Purge Lumps Reason</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPurgeDropdownOpen(false);
                        setNewPurgeForm({
                          name: scrapConfig.lumbesScrapCategory || '',
                          description: '',
                          polymerType: 'Polypropylene (PP)',
                        });
                        setIsCreatePurgeModalOpen(true);
                      }}
                      className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-0.5"
                    >
                      <Plus className="w-2.5 h-2.5" /> + New in Admin
                    </button>
                  </div>
                  {filteredPurges.map((cat) => (
                    <div
                      key={cat.id}
                      onClick={() => {
                        onChange({
                          scrapConfig: { ...scrapConfig, lumbesScrapCategory: cat.name },
                        });
                        setIsPurgeDropdownOpen(false);
                      }}
                      className="px-2.5 py-1.5 hover:bg-amber-50 cursor-pointer text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-gray-900">{cat.name}</div>
                        <div className="text-[10px] text-gray-500 truncate max-w-[200px]">{cat.polymerType}</div>
                      </div>
                    </div>
                  ))}
                  {filteredPurges.length === 0 && (
                    <div className="p-3 text-center text-gray-500 text-xs">
                      No matching purge lump categories.
                      <button
                        type="button"
                        onClick={() => {
                          setIsPurgeDropdownOpen(false);
                          setNewPurgeForm({
                            name: scrapConfig.lumbesScrapCategory,
                            description: '',
                            polymerType: 'Polypropylene (PP)',
                          });
                          setIsCreatePurgeModalOpen(true);
                        }}
                        className="block mx-auto mt-1.5 text-xs text-teal-700 font-bold hover:underline"
                      >
                        + Create "{scrapConfig.lumbesScrapCategory}" as new Category
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Regrind Slider & Permissions */}
        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={scrapConfig.regridRecoveryAllowed}
                onChange={(e) =>
                  onChange({
                    scrapConfig: { ...scrapConfig, regridRecoveryAllowed: e.target.checked },
                  })
                }
                className="rounded text-emerald-600"
              />
              <span className="font-bold text-emerald-950">
                Allow Closed-Loop Regrind Material Recovery &amp; Cost Credit
              </span>
            </label>

            {scrapConfig.regridRecoveryAllowed && (
              <span className="font-mono text-xs font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300">
                Max Allowed: {scrapConfig.maxRegrindPct}%
              </span>
            )}
          </div>

          {scrapConfig.regridRecoveryAllowed && (
            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={scrapConfig.maxRegrindPct}
                onChange={(e) =>
                  onChange({
                    scrapConfig: { ...scrapConfig, maxRegrindPct: parseInt(e.target.value) || 0 },
                  })
                }
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-emerald-800">
                <span>0% Virgin Only</span>
                <span>FDA / IATF Food Grade Recommended Cap: 15%</span>
                <span>30% Heavy Industrial Max</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task 6 Modal: Create Runner Scrap Category */}
      {isCreateRunnerModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E4E0D6] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-3">
              <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-600" />
                Create Runner Scrap Category in Master Data
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateRunnerModalOpen(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveNewRunnerCategory} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-[#14213D] block mb-1">
                  Category Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newRunnerForm.name}
                  onChange={(e) => setNewRunnerForm({ ...newRunnerForm, name: e.target.value })}
                  placeholder="e.g. High-Purity Virgin Regrind Granules"
                  className="w-full text-xs py-2 px-3 border border-[#E4E0D6] rounded-lg"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#14213D] block mb-1">Description / Handling Standard</label>
                <input
                  type="text"
                  value={newRunnerForm.description}
                  onChange={(e) => setNewRunnerForm({ ...newRunnerForm, description: e.target.value })}
                  placeholder="e.g. Clean virgin cold runners sorted at machine hopper"
                  className="w-full text-xs py-2 px-3 border border-[#E4E0D6] rounded-lg"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#14213D] block mb-1">Standard Recovery Allowance (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newRunnerForm.recoveryPct}
                  onChange={(e) => setNewRunnerForm({ ...newRunnerForm, recoveryPct: Number(e.target.value) || 0 })}
                  className="w-full text-xs font-mono py-2 px-3 border border-[#E4E0D6] rounded-lg"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E4E0D6]">
                <button
                  type="button"
                  onClick={() => setIsCreateRunnerModalOpen(false)}
                  className="btn btn-sm btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-primary bg-emerald-700 hover:bg-emerald-800 text-white text-xs flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Save &amp; Select Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task 6 Modal: Create Purge Lumps Category */}
      {isCreatePurgeModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E4E0D6] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-3">
              <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-600" />
                Create Purge Lumps Category in Master Data
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatePurgeModalOpen(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveNewPurgeCategory} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-[#14213D] block mb-1">
                  Category Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newPurgeForm.name}
                  onChange={(e) => setNewPurgeForm({ ...newPurgeForm, name: e.target.value })}
                  placeholder="e.g. Color Changeover Purge Compounds"
                  className="w-full text-xs py-2 px-3 border border-[#E4E0D6] rounded-lg"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#14213D] block mb-1">Resin / Polymer Substrate</label>
                <input
                  type="text"
                  value={newPurgeForm.polymerType}
                  onChange={(e) => setNewPurgeForm({ ...newPurgeForm, polymerType: e.target.value })}
                  placeholder="e.g. Polypropylene (PP), HDPE, ABS"
                  className="w-full text-xs py-2 px-3 border border-[#E4E0D6] rounded-lg"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#14213D] block mb-1">Description / Recycling Protocol</label>
                <input
                  type="text"
                  value={newPurgeForm.description}
                  onChange={(e) => setNewPurgeForm({ ...newPurgeForm, description: e.target.value })}
                  placeholder="e.g. Heavy purge cake sent to industrial shredder"
                  className="w-full text-xs py-2 px-3 border border-[#E4E0D6] rounded-lg"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E4E0D6]">
                <button
                  type="button"
                  onClick={() => setIsCreatePurgeModalOpen(false)}
                  className="btn btn-sm btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-primary bg-emerald-700 hover:bg-emerald-800 text-white text-xs flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Save &amp; Select Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Section 2: Full-width Interactive Cost Preview Card */}
      <div className="bg-[#14213D] text-white rounded-2xl p-6 shadow-xl border border-[#26365C] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#E8622C] flex items-center justify-center text-white">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-base font-bold tracking-tight text-white font-['Space_Grotesk']">
                  BOM Cost Simulation &amp; Rollup Preview
                </h4>
                <p className="text-xs text-slate-300">
                  Calculates unit, batch, and KG standard manufacturing cost using active resin pricing &amp; machine rates.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={state.materialPriceSource}
              onChange={(e) => onChange({ materialPriceSource: e.target.value as any })}
              className="bg-white/10 text-white border border-white/20 rounded-lg px-2.5 py-1.5 text-xs"
            >
              <option value="Standard price" className="text-gray-900">Standard Cost Base</option>
              <option value="Latest purchase price" className="text-gray-900">Latest Purchase PO Price</option>
              <option value="Average price" className="text-gray-900">Weighted Average Inventory</option>
              <option value="Supplier price list" className="text-gray-900">Supplier Contract Price</option>
            </select>

            <button
              type="button"
              onClick={handleRunCostPreview}
              disabled={isCalculating}
              className="btn btn-sm bg-[#E8622C] hover:bg-[#d45320] text-white border-none text-xs flex items-center gap-1.5 shadow-md"
            >
              <Calculator className={`w-3.5 h-3.5 ${isCalculating ? 'animate-spin' : ''}`} />
              {isCalculating ? 'Calculating...' : 'Run Cost Preview'}
            </button>
          </div>
        </div>

        {/* Big 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">
              Estimated Cost Per Unit
            </span>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-white mt-1">
              ${costRollup.costPerUnit.toFixed(2)}
            </div>
            <span className="text-[11px] text-emerald-400 mt-1 block">
              Includes resin, machine overhead, mold &amp; scrap
            </span>
          </div>

          <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">
              Total Standard Batch Cost
            </span>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-amber-300 mt-1">
              ${costRollup.costPerBatch.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-300 mt-1 block">
              Per {batchSize.toLocaleString()} {state.batchUOM} batch size
            </span>
          </div>

          <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">
              Net Regrind Recovery Saving
            </span>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-emerald-400 mt-1">
              {costRollup.regrindCredit < 0 ? `-$${Math.abs(costRollup.regrindCredit).toFixed(2)}` : '$0.00'}
            </div>
            <span className="text-[11px] text-slate-300 mt-1 block">
              Deducted per unit via closed-loop runner reuse
            </span>
          </div>
        </div>

        {/* Detailed Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-xs">
          <div className="bg-white/5 p-2.5 rounded-lg border border-white/10">
            <span className="text-slate-400 text-[10px] block">Raw Resin</span>
            <span className="font-mono font-bold text-white">${costRollup.materialCost}</span>
          </div>
          <div className="bg-white/5 p-2.5 rounded-lg border border-white/10">
            <span className="text-slate-400 text-[10px] block">Packaging</span>
            <span className="font-mono font-bold text-white">${costRollup.packagingCost}</span>
          </div>
          <div className="bg-white/5 p-2.5 rounded-lg border border-white/10">
            <span className="text-slate-400 text-[10px] block">Secondary Op</span>
            <span className="font-mono font-bold text-white">${costRollup.secondaryOpCost}</span>
          </div>
          <div className="bg-white/5 p-2.5 rounded-lg border border-white/10">
            <span className="text-slate-400 text-[10px] block">Direct Labor</span>
            <span className="font-mono font-bold text-white">${costRollup.laborCost}</span>
          </div>
          <div className="bg-white/5 p-2.5 rounded-lg border border-white/10">
            <span className="text-slate-400 text-[10px] block">Machine Rate</span>
            <span className="font-mono font-bold text-white">${costRollup.machineCost}</span>
          </div>
          <div className="bg-white/5 p-2.5 rounded-lg border border-white/10">
            <span className="text-slate-400 text-[10px] block">Mold Amort</span>
            <span className="font-mono font-bold text-white">${costRollup.moldAmortization}</span>
          </div>
          <div className="bg-white/5 p-2.5 rounded-lg border border-white/10">
            <span className="text-slate-400 text-[10px] block">Power / Energy</span>
            <span className="font-mono font-bold text-white">${costRollup.energyCost}</span>
          </div>
          <div className="bg-white/5 p-2.5 rounded-lg border border-white/10">
            <span className="text-slate-400 text-[10px] block">Scrap Loss</span>
            <span className="font-mono font-bold text-rose-300">${costRollup.scrapCost}</span>
          </div>
        </div>

        {/* Cost Disclaimer */}
        <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2.5 text-xs text-slate-300">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Cost Disclaimer:</strong> Estimated cost is for preview. Final standard cost may require finance approval during month-end rollup.
          </span>
        </div>
      </div>
    </div>
  );
};
