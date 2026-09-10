import React, { useState } from 'react';
import { CalibrationEquipment } from '../../types';
import { INITIAL_CALIBRATION_EQUIPMENT } from '../../data/initialData';
import {
  Wrench,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  FileCheck,
  Calendar,
  Layers,
  ArrowUpRight,
  Printer,
  Download,
  Activity,
  Award,
} from 'lucide-react';

interface Props {
  onNavigate: (view: string, param?: any) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
}

export const CalibrationEquipmentView: React.FC<Props> = ({
  onNavigate,
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  const [equipmentList, setEquipmentList] = useState<CalibrationEquipment[]>(INITIAL_CALIBRATION_EQUIPMENT);
  const [selectedEqId, setSelectedEqId] = useState<string>(INITIAL_CALIBRATION_EQUIPMENT[0]?.id || 'EQ-SPEC-02');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');

  const filteredEquipment = equipmentList.filter((eq) => {
    const matchesStatus = statusFilter === 'all' || eq.status === statusFilter;
    const matchesDept = deptFilter === 'all' || eq.dept === deptFilter;
    const matchesSearch =
      eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.model.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesDept && matchesSearch;
  });

  const selectedEquipment = equipmentList.find((e) => e.id === selectedEqId) || filteredEquipment[0] || equipmentList[0];

  const handleOpenNewCalibrationDrawer = () => {
    let id = `EQ-GAUGE-0${equipmentList.length + 1}`;
    let name = 'Micrometer (External 0-25mm)';
    let model = 'Mitutoyo 293-240-30';
    let dept = 'QC Lab';
    let freq = '6 months';
    let last = '2026-08-30';
    let next = '2027-02-28';
    let certNumber = 'NIST-CAL-99412';
    let calHouse = 'National Metrology Services Ltd.';

    openDrawer(
      'Register New Metrology / Precision Gauge',
      <div className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Equipment Tag #</label>
            <input
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded bg-[#F6F4EF] font-mono"
              defaultValue={id}
              onChange={(e) => (id = e.target.value)}
            />
          </div>
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Assigned Department</label>
            <select
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded bg-white"
              defaultValue={dept}
              onChange={(e) => (dept = e.target.value)}
            >
              <option value="QC Lab">QC Lab</option>
              <option value="Molding Floor">Molding Floor</option>
              <option value="Tool Room">Tool Room</option>
              <option value="Assembly">Assembly</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Instrument Name</label>
            <input
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded"
              defaultValue={name}
              onChange={(e) => (name = e.target.value)}
            />
          </div>
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Model / Make</label>
            <input
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded"
              defaultValue={model}
              onChange={(e) => (model = e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Interval</label>
            <select
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded bg-white"
              defaultValue={freq}
              onChange={(e) => (freq = e.target.value)}
            >
              <option value="3 months">3 months</option>
              <option value="6 months">6 months</option>
              <option value="12 months">12 months</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Last Calibration</label>
            <input
              type="date"
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded"
              defaultValue={last}
              onChange={(e) => (last = e.target.value)}
            />
          </div>
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Next Due Date</label>
            <input
              type="date"
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded"
              defaultValue={next}
              onChange={(e) => (next = e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Traceable Cert # (ISO/IEC 17025)</label>
            <input
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded font-mono"
              defaultValue={certNumber}
              onChange={(e) => (certNumber = e.target.value)}
            />
          </div>
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Calibration Agency</label>
            <input
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded"
              defaultValue={calHouse}
              onChange={(e) => (calHouse = e.target.value)}
            />
          </div>
        </div>
      </div>,
      <div className="flex justify-end gap-2 w-full">
        <button
          onClick={closeDrawer}
          className="px-3 py-1.5 text-xs font-semibold border border-[#E4E0D6] rounded text-[#6B7280] hover:bg-[#F6F4EF]"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            const newEq: CalibrationEquipment = {
              id,
              name,
              model,
              dept,
              freq,
              last,
              next,
              status: 'ok',
            };
            setEquipmentList([newEq, ...equipmentList]);
            setSelectedEqId(newEq.id);
            closeDrawer();
            showToast(`Registered precision gauge ${newEq.id}.`);
          }}
          className="px-4 py-1.5 text-xs font-semibold bg-[#14213D] text-white rounded hover:bg-[#1f3158]"
        >
          Save Gauge
        </button>
      </div>
    );
  };

  const handlePerformCalibration = (eq: CalibrationEquipment) => {
    let nextCalDate = '2027-02-28';
    let uncertainty = '±0.002 mm';
    let certNo = `CAL-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    openDrawer(
      `Post Calibration Certificate: ${eq.name} (${eq.id})`,
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px]">
          Updating calibration record resets gauge status to <strong>Compliant (OK)</strong> and generates an ISO 17025 verification trail.
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Master Standard Used</label>
            <input
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded"
              defaultValue="Grade 0 Gauge Blocks (Set #401)"
            />
          </div>
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Measurement Uncertainty</label>
            <input
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded font-mono"
              defaultValue={uncertainty}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Calibration Certificate #</label>
            <input
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded font-mono"
              defaultValue={certNo}
            />
          </div>
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Next Recalibration Due</label>
            <input
              type="date"
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded font-mono"
              defaultValue={nextCalDate}
              onChange={(e) => (nextCalDate = e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-[#14213D] mb-1">Verification Note / Environmental Temp</label>
          <textarea
            rows={2}
            className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded"
            defaultValue="Calibration conducted at 20.0°C ± 0.5°C, 48% RH. Gauge meets manufacturer class tolerances."
          />
        </div>
      </div>,
      <div className="flex justify-end gap-2 w-full">
        <button
          onClick={closeDrawer}
          className="px-3 py-1.5 text-xs font-semibold border border-[#E4E0D6] rounded text-[#6B7280] hover:bg-[#F6F4EF]"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            const updated = equipmentList.map((e) =>
              e.id === eq.id
                ? {
                    ...e,
                    last: 'Today (31 Aug 2026)',
                    next: nextCalDate,
                    status: 'ok' as const,
                  }
                : e
            );
            setEquipmentList(updated);
            closeDrawer();
            showToast(`Calibration verified for ${eq.id}. Next due: ${nextCalDate}`);
          }}
          className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded hover:bg-emerald-700"
        >
          Post &amp; Certify Calibration
        </button>
      </div>
    );
  };

  const overdueCount = equipmentList.filter((e) => e.status === 'overdue').length;
  const dueSoonCount = equipmentList.filter((e) => e.status === 'due_soon').length;
  const okCount = equipmentList.filter((e) => e.status === 'ok').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-[#0F8B8D] font-bold">
            Quality Assurance &middot; Metrology &amp; Equipment Calibration
          </div>
          <h1 className="text-2xl font-bold text-[#14213D] font-['Space_Grotesk']">
            Gauge &amp; Metrology Calibration (MSA)
          </h1>
          <p className="text-xs text-[#6B7280]">
            NIST &amp; ISO/IEC 17025 traceable calibration master register, Gage R&amp;R repeatability studies, and automated recalibration alerts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenNewCalibrationDrawer}
            className="px-3.5 py-1.5 text-xs font-semibold bg-[#14213D] text-white rounded-lg hover:bg-[#1f3158] flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" /> + Register Gauge
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-[#E4E0D6] shadow-sm">
          <div className="text-xs font-semibold text-[#6B7280]">Active Instruments</div>
          <div className="text-2xl font-bold text-[#14213D] font-['Space_Grotesk'] mt-1">
            {equipmentList.length}
          </div>
          <div className="text-[11px] text-[#0F8B8D] font-mono mt-0.5">QC Lab &amp; Production Floor</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-sm">
          <div className="text-xs font-semibold text-emerald-800 flex items-center justify-between">
            <span>Calibrated (In Spec)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-900 font-['Space_Grotesk'] mt-1">
            {okCount}
          </div>
          <div className="text-[11px] text-emerald-700 font-mono mt-0.5">Fully certified &amp; active</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-amber-200 bg-amber-50/30 shadow-sm">
          <div className="text-xs font-semibold text-amber-800 flex items-center justify-between">
            <span>Due Soon (&lt; 30d)</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-900 font-['Space_Grotesk'] mt-1">
            {dueSoonCount}
          </div>
          <div className="text-[11px] text-amber-700 font-mono mt-0.5">Calibration scheduled</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-rose-200 bg-rose-50/30 shadow-sm">
          <div className="text-xs font-semibold text-rose-800 flex items-center justify-between">
            <span>Overdue (Quarantine)</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-900 font-['Space_Grotesk'] mt-1">
            {overdueCount}
          </div>
          <div className="text-[11px] text-rose-700 font-mono mt-0.5">Immediate calibration required</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E4E0D6] shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-2.5 top-2 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Search Tag, Model, Instrument..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#E4E0D6] rounded-lg focus:outline-none focus:border-[#0F8B8D]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-semibold bg-[#F6F4EF] border border-[#E4E0D6] rounded-lg"
          >
            <option value="all">All Statuses</option>
            <option value="ok">Compliant (OK)</option>
            <option value="due_soon">Due Soon</option>
            <option value="overdue">Overdue</option>
          </select>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-semibold bg-[#F6F4EF] border border-[#E4E0D6] rounded-lg"
          >
            <option value="all">All Departments</option>
            <option value="QC Lab">QC Lab</option>
            <option value="Molding Floor">Molding Floor</option>
          </select>
        </div>
        <div className="text-xs text-[#6B7280] font-mono">
          Showing <strong>{filteredEquipment.length}</strong> instruments
        </div>
      </div>

      {/* Split View: Left List, Right Deep Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List */}
        <div className="lg:col-span-5 space-y-3">
          {filteredEquipment.map((eq) => {
            const isSelected = eq.id === selectedEquipment?.id;

            return (
              <div
                key={eq.id}
                onClick={() => setSelectedEqId(eq.id)}
                className={`p-4 bg-white rounded-xl border transition-all cursor-pointer shadow-sm ${
                  isSelected
                    ? 'border-[#0F8B8D] ring-2 ring-[#0F8B8D]/15'
                    : 'border-[#E4E0D6] hover:border-[#0F8B8D]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-[#0F8B8D]">{eq.id}</span>
                  <span
                    className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                      eq.status === 'ok'
                        ? 'bg-emerald-100 text-emerald-800'
                        : eq.status === 'due_soon'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {eq.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="font-bold text-xs text-[#14213D] mt-1">
                  {eq.name}
                </div>
                <div className="text-[11px] text-[#6B7280]">
                  Model: {eq.model} &middot; Dept: <strong>{eq.dept}</strong>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] text-[#6B7280] font-mono mt-3 pt-2 border-t border-[#E4E0D6]">
                  <div>Last: {eq.last}</div>
                  <div className={eq.status === 'overdue' ? 'text-rose-700 font-bold' : ''}>
                    Next: {eq.next}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Detail Card */}
        <div className="lg:col-span-7">
          {selectedEquipment ? (
            <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-[#E4E0D6] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#0F8B8D]">{selectedEquipment.id}</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        selectedEquipment.status === 'ok'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedEquipment.status === 'due_soon'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {selectedEquipment.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-[#14213D] font-['Space_Grotesk'] mt-1">
                    {selectedEquipment.name}
                  </h2>
                  <p className="text-xs text-[#6B7280] font-mono mt-0.5">
                    Model: <strong>{selectedEquipment.model}</strong> &middot; Department: <strong>{selectedEquipment.dept}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePerformCalibration(selectedEquipment)}
                    className="px-3 py-1.5 text-xs font-semibold bg-[#14213D] text-white rounded-lg hover:bg-[#1f3158] flex items-center gap-1.5 shadow-sm"
                  >
                    <Wrench className="w-3.5 h-3.5 text-amber-400" /> Recalibrate
                  </button>
                  <button
                    onClick={() => showToast(`Downloaded NIST Traceability Certificate for ${selectedEquipment.id}`)}
                    className="p-2 text-[#6B7280] hover:text-[#14213D] border border-[#E4E0D6] rounded-lg hover:bg-[#F6F4EF]"
                    title="Download Certificate"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Calibration Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-[#F6F4EF] rounded-xl border border-[#E4E0D6] text-xs">
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#6B7280]">Interval</div>
                  <div className="font-bold text-[#14213D]">{selectedEquipment.freq}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#6B7280]">Last Calibrated</div>
                  <div className="font-mono font-bold text-[#14213D]">{selectedEquipment.last}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#6B7280]">Next Due Date</div>
                  <div className={`font-mono font-bold ${selectedEquipment.status === 'overdue' ? 'text-rose-600' : 'text-[#0F8B8D]'}`}>
                    {selectedEquipment.next}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#6B7280]">Traceability</div>
                  <div className="font-bold text-[#14213D]">ISO/IEC 17025</div>
                </div>
              </div>

              {/* Measurement System Analysis (MSA / Gage R&R) Widget */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#14213D] flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#0F8B8D]" />
                    Gage R&amp;R Repeatability &amp; Reproducibility (MSA)
                  </h3>
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    %GRR: 6.8% (Acceptable &lt; 10%)
                  </span>
                </div>

                <div className="p-4 bg-white border border-[#E4E0D6] rounded-xl space-y-3 text-xs">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 bg-[#F6F4EF] rounded-lg">
                      <div className="text-[10px] text-[#6B7280] uppercase font-bold">Equipment Variation (EV)</div>
                      <div className="font-bold text-[#14213D] text-sm mt-0.5">4.2%</div>
                      <div className="text-[10px] text-[#6B7280]">Repeatability</div>
                    </div>
                    <div className="p-2.5 bg-[#F6F4EF] rounded-lg">
                      <div className="text-[10px] text-[#6B7280] uppercase font-bold">Appraiser Variation (AV)</div>
                      <div className="font-bold text-[#14213D] text-sm mt-0.5">2.6%</div>
                      <div className="text-[10px] text-[#6B7280]">Reproducibility</div>
                    </div>
                    <div className="p-2.5 bg-[#F6F4EF] rounded-lg">
                      <div className="text-[10px] text-[#6B7280] uppercase font-bold">Number of Distinct Categories</div>
                      <div className="font-bold text-[#0F8B8D] text-sm mt-0.5">14 (ndc &gt; 5)</div>
                      <div className="text-[10px] text-emerald-700">Excellent discrimination</div>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#6B7280] leading-relaxed">
                    Based on 10 parts, 3 appraisers, and 3 trials following AIAG MSA Manual 4th Edition. The measurement system is statistically sound for in-process inspection and process capability assessment.
                  </p>
                </div>
              </div>

              {/* Traceability Audit Trail */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#14213D] mb-2 flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-[#0F8B8D]" />
                  Calibration Certificate &amp; Traceability Log
                </h3>
                <div className="border border-[#E4E0D6] rounded-xl divide-y divide-[#E4E0D6] text-xs">
                  <div className="p-3 flex items-center justify-between hover:bg-[#F6F4EF]/50">
                    <div>
                      <div className="font-bold text-[#14213D]">Certificate #NIST-2026-8831</div>
                      <div className="text-[11px] text-[#6B7280]">Calibrated by: Apex Metrology Labs &middot; Result: Pass</div>
                    </div>
                    <div className="text-right font-mono text-[11px] text-[#6B7280]">
                      {selectedEquipment.last}
                    </div>
                  </div>
                  <div className="p-3 flex items-center justify-between hover:bg-[#F6F4EF]/50">
                    <div>
                      <div className="font-bold text-[#14213D]">Certificate #NIST-2025-4109</div>
                      <div className="text-[11px] text-[#6B7280]">Calibrated by: Apex Metrology Labs &middot; Result: Pass</div>
                    </div>
                    <div className="text-right font-mono text-[11px] text-[#6B7280]">
                      2025-08-28
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#6B7280] bg-white rounded-xl border border-[#E4E0D6]">
              Select a gauge or metrology equipment from the left to view records.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
