import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  FileText,
  Plus,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
  Mail,
  HardDrive,
  Factory,
  Save,
  Globe,
  Coins,
  Calendar,
} from 'lucide-react';
import { CompanyProfile, PlantDetails } from '../../types/admin';
import { mockCompanyProfile } from '../../data/mockAdminData';

interface AdminCompanyPlantsViewProps {
  showToast?: (msg: string) => void;
}

export const AdminCompanyPlantsView: React.FC<AdminCompanyPlantsViewProps> = ({
  showToast = (_msg: string) => {},
}) => {
  const [profile, setProfile] = useState<CompanyProfile>(mockCompanyProfile);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [companyForm, setCompanyForm] = useState(mockCompanyProfile);
  const [isPlantModalOpen, setIsPlantModalOpen] = useState(false);
  const [editingPlantId, setEditingPlantId] = useState<string | null>(null);

  const [plantForm, setPlantForm] = useState<Partial<PlantDetails>>({
    plantCode: '',
    plantName: '',
    division: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstin: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    totalMachines: 8,
    activeLines: 8,
    shifts: ['Shift A (06:00-14:00)', 'Shift B (14:00-22:00)'],
    defaultWarehouseName: 'Plant On-Site Raw & FG Store',
    isHeadquarters: false,
    operationalStatus: 'Fully Operational',
  });

  const handleSaveCompanyProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile(companyForm);
    setIsEditingCompany(false);
    showToast('Corporate legal entity details and statutory tax identifiers saved.');
  };

  const handleOpenCreatePlant = () => {
    setEditingPlantId(null);
    setPlantForm({
      plantCode: `PL-0${profile.plants.length + 1}-HYD`,
      plantName: '',
      division: 'Automotive / Technical Polymer Compounding',
      address: '',
      city: '',
      state: '',
      pincode: '',
      gstin: '36AABCR9281G1Z1',
      contactPerson: '',
      contactEmail: '',
      contactPhone: '',
      totalMachines: 6,
      activeLines: 6,
      shifts: ['Shift A (06:00-14:00)', 'Shift B (14:00-22:00)'],
      defaultWarehouseName: 'Central Raw & Finished Goods Warehouse',
      isHeadquarters: false,
      operationalStatus: 'Fully Operational',
    });
    setIsPlantModalOpen(true);
  };

  const handleOpenEditPlant = (plant: PlantDetails) => {
    setEditingPlantId(plant.id);
    setPlantForm(plant);
    setIsPlantModalOpen(true);
  };

  const handleSavePlant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plantForm.plantName || !plantForm.city) {
      showToast('Please specify plant facility name and city location.');
      return;
    }

    if (editingPlantId) {
      setProfile((prev) => ({
        ...prev,
        plants: prev.plants.map((p) => (p.id === editingPlantId ? { ...p, ...(plantForm as PlantDetails) } : p)),
      }));
      showToast('Manufacturing facility specifications updated.');
    } else {
      const newPlant: PlantDetails = {
        ...(plantForm as PlantDetails),
        id: `PLANT-0${profile.plants.length + 1}`,
        defaultWarehouseId: `WH-${plantForm.plantCode}-01`,
      };
      setProfile((prev) => ({
        ...prev,
        plants: [...prev.plants, newPlant],
      }));
      showToast(`Manufacturing facility ${newPlant.plantName} registered in multi-plant grid.`);
    }
    setIsPlantModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <Building2 className="w-4 h-4 text-[#0F8B8D]" />
            <span>Enterprise Hierarchy & Infrastructure</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Company Profile & Multi-Plant Facility Setup</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Corporate registration identifiers, statutory GSTIN state registrations, production plant nodes, and warehouse bindings.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setCompanyForm(profile);
              setIsEditingCompany(!isEditingCompany);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            {isEditingCompany ? 'Cancel Edit' : 'Edit Legal Profile'}
          </button>
          <button
            onClick={handleOpenCreatePlant}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Manufacturing Plant
          </button>
        </div>
      </div>

      {/* Corporate Legal Entity Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0F8B8D]/10 text-[#0F8B8D] flex items-center justify-center font-bold text-sm">
              RP
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{profile.legalEntityName}</h2>
              <p className="text-xs text-slate-400">Trade Name: {profile.companyName}</p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
            Corporate Status: Active
          </span>
        </div>

        {isEditingCompany ? (
          <form onSubmit={handleSaveCompanyProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company Trade Name</label>
                <input
                  type="text"
                  value={companyForm.companyName}
                  onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Legal Registered Entity</label>
                <input
                  type="text"
                  value={companyForm.legalEntityName}
                  onChange={(e) => setCompanyForm({ ...companyForm, legalEntityName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">CIN Number</label>
                <input
                  type="text"
                  value={companyForm.cin}
                  onChange={(e) => setCompanyForm({ ...companyForm, cin: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Corporate PAN</label>
                <input
                  type="text"
                  value={companyForm.pan}
                  onChange={(e) => setCompanyForm({ ...companyForm, pan: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Base Currency</label>
                <input
                  type="text"
                  value={companyForm.baseCurrency}
                  onChange={(e) => setCompanyForm({ ...companyForm, baseCurrency: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fiscal Year Start Month</label>
                <input
                  type="text"
                  value={companyForm.fiscalYearStartMonth}
                  onChange={(e) => setCompanyForm({ ...companyForm, fiscalYearStartMonth: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Registered Office Address</label>
                <input
                  type="text"
                  value={companyForm.registeredOffice}
                  onChange={(e) => setCompanyForm({ ...companyForm, registeredOffice: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingCompany(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-[#0F8B8D] text-white font-semibold shadow-sm"
              >
                Save Profile
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 font-medium block">Corporate Identification No. (CIN)</span>
              <span className="font-mono font-bold text-slate-900 mt-1 block">{profile.cin}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 font-medium block">Permanent Account No. (PAN)</span>
              <span className="font-mono font-bold text-slate-900 mt-1 block">{profile.pan}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 font-medium block">Headquarters GSTIN</span>
              <span className="font-mono font-bold text-slate-900 mt-1 block">{profile.gstinCorporate}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 font-medium block">Accounting Parameters</span>
              <span className="font-semibold text-slate-900 mt-1 block">
                {profile.baseCurrency} &middot; FY Starts {profile.fiscalYearStartMonth}
              </span>
            </div>
            <div className="sm:col-span-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 font-medium block">Registered Legal Address</span>
              <span className="text-slate-700 mt-1 block">{profile.registeredOffice}</span>
            </div>
            <div className="sm:col-span-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 font-medium block">Corporate Operations Office</span>
              <span className="text-slate-700 mt-1 block">{profile.corporateOffice}</span>
            </div>
          </div>
        )}
      </div>

      {/* Multi-Plant Facilities Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Factory className="w-4 h-4 text-[#0F8B8D]" />
            Operating Production Plants &amp; Processing Facilities ({profile.plants.length})
          </h2>
          <span className="text-xs text-slate-500">Each plant has dedicated warehouse zones &amp; machine banks</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {profile.plants.map((plant) => (
            <div
              key={plant.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:border-[#0F8B8D]/50 transition-all group"
            >
              <div>
                {/* Plant top badges */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                    {plant.plantCode}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {plant.isHeadquarters && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 uppercase">
                        HQ Facility
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        plant.operationalStatus === 'Fully Operational'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {plant.operationalStatus}
                    </span>
                  </div>
                </div>

                <h3 className="font-bold text-sm text-slate-900 group-hover:text-[#0F8B8D] transition-colors">
                  {plant.plantName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{plant.division}</p>

                <div className="mt-3.5 space-y-2 text-xs border-t border-slate-100 pt-3">
                  <div className="flex items-start gap-2 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <span>
                      {plant.address}, {plant.city}, {plant.state} – {plant.pincode}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600">
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono text-[11px]">GSTIN: {plant.gstin}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{plant.contactPerson} ({plant.contactPhone})</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600">
                    <HardDrive className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Warehouse: <strong>{plant.defaultWarehouseName}</strong></span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Machines Active</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {plant.activeLines} / {plant.totalMachines} Lines
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase">Operational Shifts</span>
                    <span className="font-medium text-slate-700">{plant.shifts.length} Shifts / Day</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => handleOpenEditPlant(plant)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Edit2 className="w-3 h-3" />
                  Configure Plant
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Add or Edit Plant */}
      {isPlantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="font-bold text-slate-900 text-base mb-1">
              {editingPlantId ? 'Configure Manufacturing Facility' : 'Register New Manufacturing Facility'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter physical address, state statutory GSTIN, resident head, and shop floor line limits.
            </p>

            <form onSubmit={handleSavePlant} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Plant Facility Name *</label>
                  <input
                    type="text"
                    required
                    value={plantForm.plantName}
                    onChange={(e) => setPlantForm({ ...plantForm, plantName: e.target.value })}
                    placeholder="e.g. Plant 04 — Hyderabad Extrusion Hub"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Plant Short Code *</label>
                  <input
                    type="text"
                    required
                    value={plantForm.plantCode}
                    onChange={(e) => setPlantForm({ ...plantForm, plantCode: e.target.value })}
                    placeholder="e.g. PL-04-HYD"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono uppercase"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Division / Specialization</label>
                  <input
                    type="text"
                    value={plantForm.division}
                    onChange={(e) => setPlantForm({ ...plantForm, division: e.target.value })}
                    placeholder="e.g. Automotive Underbody Blow Moldings"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Physical Street Address *</label>
                  <input
                    type="text"
                    required
                    value={plantForm.address}
                    onChange={(e) => setPlantForm({ ...plantForm, address: e.target.value })}
                    placeholder="Plot / MIDC / SIPCOT Sector Details"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City / Industrial Area *</label>
                  <input
                    type="text"
                    required
                    value={plantForm.city}
                    onChange={(e) => setPlantForm({ ...plantForm, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State / Province *</label>
                  <input
                    type="text"
                    required
                    value={plantForm.state}
                    onChange={(e) => setPlantForm({ ...plantForm, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State GSTIN (15 Digits) *</label>
                  <input
                    type="text"
                    required
                    value={plantForm.gstin}
                    onChange={(e) => setPlantForm({ ...plantForm, gstin: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Postal Pincode</label>
                  <input
                    type="text"
                    value={plantForm.pincode}
                    onChange={(e) => setPlantForm({ ...plantForm, pincode: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Resident Plant Manager</label>
                  <input
                    type="text"
                    value={plantForm.contactPerson}
                    onChange={(e) => setPlantForm({ ...plantForm, contactPerson: e.target.value })}
                    placeholder="Manager Name"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Contact</label>
                  <input
                    type="text"
                    value={plantForm.contactPhone}
                    onChange={(e) => setPlantForm({ ...plantForm, contactPhone: e.target.value })}
                    placeholder="+91 98XXX XXXXX"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Installed Machines</label>
                  <input
                    type="number"
                    value={plantForm.totalMachines}
                    onChange={(e) => setPlantForm({ ...plantForm, totalMachines: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Active Production Lines</label>
                  <input
                    type="number"
                    value={plantForm.activeLines}
                    onChange={(e) => setPlantForm({ ...plantForm, activeLines: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPlantModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#0F8B8D] hover:bg-[#0c7274] text-white font-semibold shadow-sm"
                >
                  {editingPlantId ? 'Update Plant' : 'Save Facility'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
