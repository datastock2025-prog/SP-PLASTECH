import React, { useState, useMemo, useEffect } from 'react';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Building,
  Navigation,
  Sparkles,
  Sliders,
  Filter,
  Check,
  X,
} from 'lucide-react';
import {
  transportMasterService,
  TransporterRecord,
  INITIAL_TRANSPORTERS,
} from '../../services/transportMasterService';

interface Props {
  showToast: (msg: string) => void;
}

export const AdminTransportMasterView: React.FC<Props> = ({ showToast }) => {
  const [transporters, setTransporters] = useState<TransporterRecord[]>(() =>
    transportMasterService.getTransportersSync()
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'inactive'>('ALL');
  const [modeFilter, setModeFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransporter, setEditingTransporter] = useState<TransporterRecord | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [transporterIdGstin, setTransporterIdGstin] = useState('');
  const [transporterCode, setTransporterCode] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [selectedModes, setSelectedModes] = useState<('Road' | 'Rail' | 'Air' | 'Ship' | 'Multi-Modal')[]>([
    'Road',
  ]);
  const [vehicleTypes, setVehicleTypes] = useState<string[]>(['32ft Multi-Axle Container (14 Ton)']);
  const [vehicleInput, setVehicleInput] = useState('');
  const [notes, setNotes] = useState('');

  // Reload data
  const refreshData = () => {
    setTransporters(transportMasterService.getTransportersSync());
  };

  const handleOpenCreate = () => {
    setEditingTransporter(null);
    setName('');
    setTransporterIdGstin('');
    setTransporterCode(transportMasterService.generateNextTransporterCode());
    setContactPerson('');
    setPhone('');
    setEmail('');
    setAddress('');
    setCity('Pune');
    setState('Maharashtra');
    setSelectedModes(['Road']);
    setVehicleTypes(['32ft Multi-Axle Container (14 Ton)', '20ft Closed Body Truck (7 Ton)']);
    setVehicleInput('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: TransporterRecord) => {
    setEditingTransporter(t);
    setName(t.name);
    setTransporterIdGstin(t.transporterIdGstin);
    setTransporterCode(t.transporterCode);
    setContactPerson(t.contactPerson);
    setPhone(t.phone);
    setEmail(t.email);
    setAddress(t.address);
    setCity(t.city);
    setState(t.state);
    setSelectedModes(t.transportModes);
    setVehicleTypes(t.vehicleTypes || []);
    setVehicleInput('');
    setNotes(t.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Validation Error: Transporter Name is required.');
      return;
    }
    if (!transporterIdGstin.trim() || transporterIdGstin.trim().length !== 15) {
      showToast('Validation Error: Valid 15-digit GSTIN / Transporter ID is required for E-Way Bill sync.');
      return;
    }

    const newRecord: TransporterRecord = {
      id: editingTransporter ? editingTransporter.id : `TRP-${Date.now()}`,
      transporterCode: transporterCode.trim() || transportMasterService.generateNextTransporterCode(),
      name: name.trim(),
      transporterIdGstin: transporterIdGstin.trim().toUpperCase(),
      contactPerson: contactPerson.trim() || 'Logistics Coordinator',
      phone: phone.trim() || '+91 98000 00000',
      email: email.trim() || 'dispatch@transporter.example',
      address: address.trim() || 'Transport Nagar Hub',
      city: city.trim() || 'Pune',
      state: state.trim() || 'Maharashtra',
      transportModes: selectedModes.length > 0 ? selectedModes : ['Road'],
      vehicleTypes: vehicleTypes.length > 0 ? vehicleTypes : ['Standard Truck (7 Ton)'],
      status: editingTransporter ? editingTransporter.status : 'active',
      rating: editingTransporter ? editingTransporter.rating : 4.8,
      totalShipments: editingTransporter ? editingTransporter.totalShipments : 0,
      onTimeDeliveryPct: editingTransporter ? editingTransporter.onTimeDeliveryPct : 98.0,
      notes: notes.trim(),
      createdDate: editingTransporter ? editingTransporter.createdDate : new Date().toISOString().slice(0, 10),
    };

    transportMasterService.saveTransporter(newRecord);
    refreshData();
    setIsModalOpen(false);
    showToast(
      editingTransporter
        ? `✓ Transporter ${newRecord.name} updated successfully`
        : `✓ New Transporter ${newRecord.name} (${newRecord.transporterIdGstin}) registered in Master Data!`
    );
  };

  const handleToggleStatus = (id: string) => {
    transportMasterService.toggleStatus(id);
    refreshData();
    showToast('Transporter status updated.');
  };

  const handleDelete = (id: string, tName: string) => {
    if (window.confirm(`Are you sure you want to remove transporter "${tName}"?`)) {
      transportMasterService.deleteTransporter(id);
      refreshData();
      showToast(`Transporter ${tName} removed from Master Data.`);
    }
  };

  // Filtered List
  const filtered = useMemo(() => {
    return transporters.filter((t) => {
      const matchSearch =
        searchTerm === '' ||
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.transporterCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.transporterIdGstin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchMode = modeFilter === 'ALL' || t.transportModes.includes(modeFilter as any);

      return matchSearch && matchStatus && matchMode;
    });
  }, [transporters, searchTerm, statusFilter, modeFilter]);

  const activeCount = transporters.filter((t) => t.status === 'active').length;

  return (
    <div className="space-y-5 animate-fade-in text-slate-800">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#14213D] via-[#1b2b4e] to-[#0F8B8D] rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white uppercase tracking-wider flex items-center gap-1 border border-white/15">
              <Truck className="w-3 h-3 text-[#E8622C]" /> Transport &amp; Fleet Logistics Governance
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-teal-400/20 text-teal-200 border border-teal-400/30">
              E-Way Bill 15-Digit GSTIN Verified
            </span>
          </div>
          <h1 className="text-2xl font-bold font-['Space_Grotesk'] tracking-tight">
            Transporter Master Directory
          </h1>
          <p className="text-slate-300 text-xs mt-0.5 max-w-2xl">
            Maintain authorized logistics carriers, GSTIN Transporter IDs for NIC E-Way Bill generation, fleet capacities, and driver/vehicle taxonomy.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#E8622C] hover:bg-[#d45320] text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Register New Transporter</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-xl bg-teal-50 text-[#0F8B8D]">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">Registered Transporters</div>
            <div className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
              {transporters.length} Fleets
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">Active Approved Carriers</div>
            <div className="text-xl font-bold font-['Space_Grotesk'] text-emerald-700">
              {activeCount} Active
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">NIC EWB Registered</div>
            <div className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
              100% Verified
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">Avg On-Time SLA</div>
            <div className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
              97.2% Rating
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Transporter Name, Code, GSTIN ID, City..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700"
          >
            <option value="ALL">All Transport Modes</option>
            <option value="Road">Road Logistics</option>
            <option value="Rail">Rail Freight</option>
            <option value="Air">Air Express</option>
            <option value="Multi-Modal">Multi-Modal</option>
          </select>
        </div>
      </div>

      {/* Transporters Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5 font-semibold">Transporter Name &amp; Code</th>
                <th className="py-3 px-3.5 font-semibold">15-Digit GSTIN / EWB ID</th>
                <th className="py-3 px-3.5 font-semibold">Contact &amp; Hub</th>
                <th className="py-3 px-3.5 font-semibold">Transport Modes</th>
                <th className="py-3 px-3.5 font-semibold">Fleet / Vehicle Capabilities</th>
                <th className="py-3 px-3.5 font-semibold text-center">Status</th>
                <th className="py-3 px-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No transporters found matching search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition">
                    {/* Name & Code */}
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-[#14213D] text-xs flex items-center gap-1.5">
                        {t.name}
                        <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                          {t.transporterCode}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{t.notes || 'Standard Logistics Partner'}</div>
                    </td>

                    {/* GSTIN / EWB ID */}
                    <td className="py-3 px-3.5">
                      <div className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded inline-block text-[11px]">
                        {t.transporterIdGstin}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> E-Way Bill Auto-Match
                      </div>
                    </td>

                    {/* Contact & Hub */}
                    <td className="py-3 px-3.5">
                      <div className="font-medium text-slate-800">{t.contactPerson}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" /> {t.phone}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" /> {t.city}, {t.state}
                      </div>
                    </td>

                    {/* Modes */}
                    <td className="py-3 px-3.5">
                      <div className="flex flex-wrap gap-1">
                        {t.transportModes.map((m) => (
                          <span
                            key={m}
                            className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] font-semibold border border-blue-200"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Vehicle Types */}
                    <td className="py-3 px-3.5">
                      <div className="text-[11px] text-slate-700 max-w-xs line-clamp-2">
                        {t.vehicleTypes && t.vehicleTypes.length > 0
                          ? t.vehicleTypes.join(' • ')
                          : 'General Trucks (7 - 14 Ton)'}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3.5 text-center">
                      <button
                        onClick={() => handleToggleStatus(t.id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition ${
                          t.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {t.status === 'active' ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 text-slate-500 hover:text-[#0F8B8D] hover:bg-teal-50 rounded-lg transition cursor-pointer"
                          title="Edit Transporter"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id, t.name)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Delete Transporter"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Register / Edit Transporter */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-50 text-[#0F8B8D]">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#14213D] font-['Space_Grotesk']">
                    {editingTransporter ? `Edit Transporter: ${editingTransporter.name}` : 'Register New Transporter Master'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Governed transporter details with 15-digit E-Way Bill GSTIN validation
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Transporter Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VRL Logistics Ltd / Om Logistics Express"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
                  />
                </div>

                {/* 15-Digit GSTIN Transporter ID */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    15-Digit Transporter GSTIN / EWB ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={15}
                    placeholder="e.g. 27AABCV1234F1Z1"
                    value={transporterIdGstin}
                    onChange={(e) => setTransporterIdGstin(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none uppercase"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Must be exactly 15 alphanumeric characters.
                  </span>
                </div>

                {/* Transporter Code */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Transporter Code</label>
                  <input
                    type="text"
                    value={transporterCode}
                    onChange={(e) => setTransporterCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold bg-slate-50"
                  />
                </div>

                {/* Contact Person */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="Fleet Manager / Dispatch Head"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile / Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98XXX XXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="dispatch@transporter.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Base Hub City</label>
                  <input
                    type="text"
                    placeholder="Pune / Mumbai / Chennai / Gurugram"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                {/* State */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    placeholder="Maharashtra / Tamil Nadu / Gujarat"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                {/* Transport Modes */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Supported Transport Modes</label>
                  <div className="flex items-center gap-3 flex-wrap">
                    {(['Road', 'Rail', 'Air', 'Ship', 'Multi-Modal'] as const).map((mode) => {
                      const isChecked = selectedModes.includes(mode);
                      return (
                        <label
                          key={mode}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                            isChecked
                              ? 'bg-teal-50 border-teal-300 text-teal-800'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedModes(selectedModes.filter((m) => m !== mode));
                              } else {
                                setSelectedModes([...selectedModes, mode]);
                              }
                            }}
                            className="hidden"
                          />
                          {isChecked && <Check className="w-3 h-3 text-teal-600" />}
                          <span>{mode}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Vehicle Types Tag List */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Vehicle &amp; Fleet Types</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Add vehicle type (e.g. 32ft HQ Container, Eicher 17ft, 20ft Truck)..."
                      value={vehicleInput}
                      onChange={(e) => setVehicleInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (vehicleInput.trim()) {
                            setVehicleTypes([...vehicleTypes, vehicleInput.trim()]);
                            setVehicleInput('');
                          }
                        }
                      }}
                      className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (vehicleInput.trim()) {
                          setVehicleTypes([...vehicleTypes, vehicleInput.trim()]);
                          setVehicleInput('');
                        }
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {vehicleTypes.map((v, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-slate-700 text-[11px] font-medium"
                      >
                        {v}
                        <button
                          type="button"
                          onClick={() => setVehicleTypes(vehicleTypes.filter((_, idx) => idx !== i))}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Hub Address */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Hub / Yard Address</label>
                  <input
                    type="text"
                    placeholder="Plot / Yard number, Transport Nagar, Highway..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Operational Notes / Route Specialization</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Preferred carrier for Western corridor finished bumpers & JIT OEM deliveries..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  {editingTransporter ? 'Update Transporter' : 'Register Transporter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
