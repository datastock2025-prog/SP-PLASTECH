import React, { useState } from 'react';
import {
  Building,
  Plus,
  Zap,
  ShieldAlert,
  MapPin,
  UserCheck,
  CheckCircle2,
  Calendar,
  Layers,
  Phone,
  Mail,
  Edit2,
  Sliders,
} from 'lucide-react';

interface PlantBranch {
  id: string;
  code: string;
  name: string;
  type: 'Injection Molding Hub' | 'Compounding & Masterbatch' | 'Auxiliary & Tooling';
  address: string;
  city: string;
  state: string;
  gstin: string;
  factoryLicenseNo: string;
  pollutionConsentNo: string;
  consentExpiryDate: string;
  totalMachineBays: number;
  activeTonnageRange: string;
  connectedPowerKva: number;
  dgSetBackupKva: number;
  plantHead: string;
  plantHeadPhone: string;
  ehsOfficer: string;
  status: 'Operational' | 'Maintenance Overhaul';
}

const mockPlantsList: PlantBranch[] = [
  {
    id: 'PLANT-01',
    code: 'PUN-CHK-01',
    name: 'Pune / Chakan Hub',
    type: 'Injection Molding Hub',
    address: 'Plot No. C-14, Phase II, MIDC Industrial Area, Chakan',
    city: 'Pune',
    state: 'Maharashtra',
    gstin: '27AABCR1234F1Z8',
    factoryLicenseNo: 'FL-PUN-2022-8819',
    pollutionConsentNo: 'MPCB/RO-PUN/CTO-RED/24-912',
    consentExpiryDate: '2028-03-31',
    totalMachineBays: 24,
    activeTonnageRange: '150T to 1200T',
    connectedPowerKva: 3200,
    dgSetBackupKva: 2500,
    plantHead: 'Rameshwar Patil',
    plantHeadPhone: '+91 98220 99112',
    ehsOfficer: 'Anand Shinde',
    status: 'Operational',
  },
  {
    id: 'PLANT-02',
    code: 'SND-GIDC-02',
    name: 'Sanand Precision Plastics',
    type: 'Compounding & Masterbatch',
    address: 'Plot No. 89, GIDC Industrial Estate, Sanand II',
    city: 'Ahmedabad',
    state: 'Gujarat',
    gstin: '24AABCR1234F1Z3',
    factoryLicenseNo: 'FL-AHD-2023-4122',
    pollutionConsentNo: 'GPCB/CTO-AIR-WATER/2023-1102',
    consentExpiryDate: '2027-12-31',
    totalMachineBays: 16,
    activeTonnageRange: '80T to 650T + Extruders',
    connectedPowerKva: 2400,
    dgSetBackupKva: 1800,
    plantHead: 'Dhaval Patel',
    plantHeadPhone: '+91 94260 77334',
    ehsOfficer: 'Mitesh Solanki',
    status: 'Operational',
  },
  {
    id: 'PLANT-03',
    code: 'CHN-SRI-03',
    name: 'Chennai Automotive Molding',
    type: 'Injection Molding Hub',
    address: 'Survey No. 204, SIPCOT Industrial Park, Sriperumbudur',
    city: 'Kanchipuram',
    state: 'Tamil Nadu',
    gstin: '33AABCR1234F1Z5',
    factoryLicenseNo: 'FL-TN-2024-0981',
    pollutionConsentNo: 'TNPCB/CTO-EXP/2024-550',
    consentExpiryDate: '2029-06-30',
    totalMachineBays: 18,
    activeTonnageRange: '250T to 850T',
    connectedPowerKva: 2800,
    dgSetBackupKva: 2000,
    plantHead: 'S. Rajagopalan',
    plantHeadPhone: '+91 98400 44221',
    ehsOfficer: 'K. Balaji',
    status: 'Operational',
  },
];

interface AdminPlantBranchSettingsViewProps {
  showToast?: (msg: string) => void;
}

export const AdminPlantBranchSettingsView: React.FC<AdminPlantBranchSettingsViewProps> = ({
  showToast = (_msg: string) => {},
}) => {
  const [plants, setPlants] = useState<PlantBranch[]>(mockPlantsList);
  const [selectedPlant, setSelectedPlant] = useState<PlantBranch>(plants[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPlant, setNewPlant] = useState({
    name: '',
    code: '',
    city: '',
    state: 'Maharashtra',
    type: 'Injection Molding Hub' as const,
    connectedPowerKva: 2000,
    totalMachineBays: 12,
  });

  const handleCreatePlant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlant.name || !newPlant.code) {
      showToast('Please fill out plant name and code.');
      return;
    }
    const created: PlantBranch = {
      id: `PLANT-0${plants.length + 1}`,
      code: newPlant.code.toUpperCase(),
      name: newPlant.name,
      type: newPlant.type,
      address: `Industrial Sector 4, ${newPlant.city}`,
      city: newPlant.city,
      state: newPlant.state,
      gstin: '27AABCR1234F1ZX',
      factoryLicenseNo: `FL-${newPlant.code}-2026`,
      pollutionConsentNo: 'PCB/CTO-PENDING',
      consentExpiryDate: '2029-12-31',
      totalMachineBays: Number(newPlant.totalMachineBays),
      activeTonnageRange: '100T to 650T',
      connectedPowerKva: Number(newPlant.connectedPowerKva),
      dgSetBackupKva: Number(newPlant.connectedPowerKva) * 0.75,
      plantHead: 'Operations Lead',
      plantHeadPhone: '+91 90000 00000',
      ehsOfficer: 'EHS Executive',
      status: 'Operational',
    };
    setPlants([...plants, created]);
    setSelectedPlant(created);
    setIsModalOpen(false);
    showToast(`Registered new facility: "${created.name}".`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <Building className="w-4 h-4 text-[#0F8B8D]" />
            <span>Manufacturing Network &amp; Factory Hubs</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Plant / Branch Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure multi-location injection molding plants, electrical substation kVA, statutory factory licenses, and pollution control clearances.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg shadow-sm transition-colors self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Manufacturing Plant
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Plant Cards (Left Side) */}
        <div className="lg:col-span-5 space-y-3">
          {plants.map((plt) => {
            const isSelected = selectedPlant.id === plt.id;
            return (
              <div
                key={plt.id}
                onClick={() => setSelectedPlant(plt)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0F8B8D]/5 border-[#0F8B8D] shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {plt.code}
                    </span>
                    <h3 className="font-bold text-xs text-slate-900 mt-1">{plt.name}</h3>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {plt.city}, {plt.state}
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {plt.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Injection Bays</span>
                    <span className="font-bold text-slate-800">{plt.totalMachineBays} Machine Cells</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Tonnage Range</span>
                    <span className="font-bold text-[#0F8B8D]">{plt.activeTonnageRange}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Plant Detail Spec (Right Side) */}
        {selectedPlant && (
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#0F8B8D] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {selectedPlant.code}
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-1">{selectedPlant.name}</h2>
                <p className="text-xs text-slate-500">{selectedPlant.address}</p>
              </div>

              <button
                onClick={() => showToast(`Saved configuration for ${selectedPlant.name}.`)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#0F8B8D] text-white hover:bg-[#0c7274] transition-colors"
              >
                Save Plant Parameters
              </button>
            </div>

            {/* Statutory Licenses */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                Statutory Regulatory &amp; Environmental Consents
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Factory License No.</span>
                  <span className="font-mono font-bold text-slate-800">{selectedPlant.factoryLicenseNo}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">State PCB Consent (CTO)</span>
                  <span className="font-mono font-bold text-slate-800">{selectedPlant.pollutionConsentNo}</span>
                  <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                    Valid till: {selectedPlant.consentExpiryDate}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">State GSTIN ID</span>
                  <span className="font-mono font-bold text-slate-800">{selectedPlant.gstin}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Facility Classification</span>
                  <span className="font-semibold text-slate-800">{selectedPlant.type}</span>
                </div>
              </div>
            </div>

            {/* Power & Substation Infrastructure */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-yellow-500" />
                Electrical Power Grid &amp; Generator Backup (Plastics Continuous Load)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-teal-50/50 rounded-lg border border-teal-200">
                  <span className="text-[10px] uppercase font-semibold text-teal-700 block">Connected Grid Load</span>
                  <span className="font-mono text-base font-bold text-teal-900">
                    {selectedPlant.connectedPowerKva} kVA
                  </span>
                  <span className="text-[10px] text-teal-600 block mt-0.5">HT Substation 11kV / 433V Step-down</span>
                </div>
                <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200">
                  <span className="text-[10px] uppercase font-semibold text-amber-700 block">Captive DG Set Backup</span>
                  <span className="font-mono text-base font-bold text-amber-900">
                    {selectedPlant.dgSetBackupKva} kVA
                  </span>
                  <span className="text-[10px] text-amber-700 block mt-0.5">Auto Mains Failure (AMF) in 15 sec</span>
                </div>
              </div>
            </div>

            {/* Key Personnel */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-[#0F8B8D]" />
                Designated Plant Leadership
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Plant Operations Head</span>
                  <span className="font-bold text-slate-800">{selectedPlant.plantHead}</span>
                  <span className="text-[11px] text-slate-500 block">{selectedPlant.plantHeadPhone}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">EHS &amp; Safety Officer</span>
                  <span className="font-bold text-slate-800">{selectedPlant.ehsOfficer}</span>
                  <span className="text-[11px] text-emerald-600 block">Certified Safety Auditor</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: New Plant */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6">
            <h3 className="font-bold text-slate-900 text-base mb-1">Add New Plant / Branch Facility</h3>
            <p className="text-xs text-slate-500 mb-4">
              Provision a new injection molding shopfloor, compounding warehouse, or toolroom branch.
            </p>

            <form onSubmit={handleCreatePlant} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Plant Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BLR-HOB-04"
                    value={newPlant.code}
                    onChange={(e) => setNewPlant({ ...newPlant, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Facility Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bengaluru Aerospace Molding"
                    value={newPlant.name}
                    onChange={(e) => setNewPlant({ ...newPlant, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bengaluru"
                    value={newPlant.city}
                    onChange={(e) => setNewPlant({ ...newPlant, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={newPlant.state}
                    onChange={(e) => setNewPlant({ ...newPlant, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Machine Bays</label>
                  <input
                    type="number"
                    value={newPlant.totalMachineBays}
                    onChange={(e) => setNewPlant({ ...newPlant, totalMachineBays: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Connected Load (kVA)</label>
                  <input
                    type="number"
                    value={newPlant.connectedPowerKva}
                    onChange={(e) => setNewPlant({ ...newPlant, connectedPowerKva: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#0F8B8D] hover:bg-[#0c7274] text-white font-semibold shadow-sm"
                >
                  Save Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
