import React, { useState } from 'react';
import {
  X,
  PlayCircle,
  Clock,
  AlertTriangle,
  ShoppingCart,
  PackageCheck,
  ArrowRightCircle,
  FileText,
  Boxes,
  GitBranch,
  Wrench,
  CheckSquare,
  Sparkles,
  Check,
  Upload,
  Calendar,
  Building2,
  User,
  ShieldAlert,
  ArrowRight,
  Pin,
  PinOff,
} from 'lucide-react';
import { QuickActionItem } from '../../data/quickActionsData';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: QuickActionItem | null;
  onSuccess: (message: string, recordId?: string) => void;
  currentUser?: any;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  isOpen,
  onClose,
  action,
  onSuccess,
  currentUser,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'details'>('form');

  // Form states for various Quick Actions
  // 1. Work Order
  const [woFgItem, setWoFgItem] = useState('FG-BUMP-01 (Molded Auto Front Grille)');
  const [woQty, setWoQty] = useState('1200');
  const [woDate, setWoDate] = useState(new Date().toISOString().split('T')[0]);
  const [woShift, setWoShift] = useState(currentUser?.shift || 'Shift A — Morning (06:00 – 14:00)');
  const [woMachine, setWoMachine] = useState('IMM-ENGEL-650 (650T Engel Victory)');
  const [woMold, setWoMold] = useState('MLD-AUTO-09 (2-Cavity Hot Runner)');
  const [woLocation, setWoLocation] = useState('WH-01-SILO-A');
  const [woPriority, setWoPriority] = useState('Urgent');
  const [woNotes, setWoNotes] = useState('');

  // 2. Purchase Requisition
  const [prItem, setPrItem] = useState('RM-PP-CP01 (PP Copolymer MFI 12)');
  const [prQty, setPrQty] = useState('10000');
  const [prDate, setPrDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
  const [prSupplier, setPrSupplier] = useState('Reliance Industries Ltd (RIL)');
  const [prDept, setPrDept] = useState(currentUser?.department || 'Executive Operations');
  const [prJustification, setPrJustification] = useState('Buffer replenishment for upcoming OEM batch runs');

  // 3. Maintenance Request
  const [maintMachine, setMaintMachine] = useState('IMM-KM-350 (KraussMaffei 350T)');
  const [maintProblem, setMaintProblem] = useState('Heater Band / Electrical');
  const [maintPriority, setMaintPriority] = useState('High');
  const [maintDesc, setMaintDesc] = useState('Zone 3 thermocouple fluctuating; heater band resistance open.');

  // 4. NCR
  const [ncrItem, setNcrItem] = useState('FG-BUMP-01 / Lot #LOT-2026-0819');
  const [ncrDefect, setNcrDefect] = useState('Sink Marks & Warpage');
  const [ncrQty, setNcrQty] = useState('84');
  const [ncrSeverity, setNcrSeverity] = useState('Major');
  const [ncrDesc, setNcrDesc] = useState('Sink marks observed along reinforcement rib lines on Cavity 2.');

  // 5. Downtime
  const [dtMachine, setDtMachine] = useState('IMM-ENGEL-650 (650T Engel Victory)');
  const [dtReason, setDtReason] = useState('Mold Changeover & Barrel Purging');
  const [dtDuration, setDtDuration] = useState('45');
  const [dtNotes, setDtNotes] = useState('Purging natural PP to high-jetness black masterbatch.');

  // 6. Receive Goods
  const [grnPo, setGrnPo] = useState('PO-2026-089 (Reliance Polymers)');
  const [grnLot, setGrnLot] = useState('LOT-2026-0905-RIL');
  const [grnQty, setGrnQty] = useState('12500');
  const [grnBin, setGrnBin] = useState('SILO-A02 (Virgin Resin Silo)');

  if (!isOpen || !action) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      let recordId = '';
      let msg = '';

      switch (action.formType) {
        case 'workOrder':
          recordId = `WO-2026-${Math.floor(1000 + Math.random() * 9000)}`;
          msg = `Work Order ${recordId} scheduled on ${woMachine.split(' ')[0]} successfully!`;
          break;
        case 'purchaseReq':
          recordId = `PR-2026-${Math.floor(100 + Math.random() * 900)}`;
          msg = `Purchase Requisition ${recordId} submitted for ${prQty} KG polymer!`;
          break;
        case 'maintenanceReq':
          recordId = `MNT-2026-${Math.floor(100 + Math.random() * 900)}`;
          msg = `Maintenance Work Request ${recordId} created for ${maintMachine.split(' ')[0]}!`;
          break;
        case 'ncr':
          recordId = `NCR-2026-${Math.floor(100 + Math.random() * 900)}`;
          msg = `Quality Non-Conformance ${recordId} registered; ${ncrQty} parts quarantined!`;
          break;
        case 'downtime':
          recordId = `DT-2026-${Math.floor(100 + Math.random() * 900)}`;
          msg = `Downtime of ${dtDuration} mins logged on ${dtMachine.split(' ')[0]}!`;
          break;
        case 'receiveGoods':
          recordId = `GRN-2026-${Math.floor(100 + Math.random() * 900)}`;
          msg = `Goods Receipt Note ${recordId} inwarded with ${grnQty} KG to ${grnBin}!`;
          break;
        default:
          recordId = `REC-2026-${Math.floor(100 + Math.random() * 900)}`;
          msg = `${action.name} executed successfully! (${recordId})`;
      }

      onSuccess(msg, recordId);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0F8B8D]/10 text-[#0F8B8D] flex items-center justify-center shadow-xs">
              <PlayCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{action.name}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8622C]/10 text-[#E8622C]">
                  {action.module}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{action.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Auto-filled Context Header */}
        <div className="px-5 py-2.5 bg-teal-50/70 border-b border-teal-100 flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 font-medium">
            <Building2 className="w-3.5 h-3.5 text-[#0F8B8D]" />
            <span>Plant: <strong>{currentUser?.plantId || 'PLANT-01 (Hosur IMM)'}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#E8622C]" />
            <span>Shift: <strong>Shift A (06:00 - 14:00)</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-500" />
            <span>User: <strong>{currentUser?.name || 'Priya Rao'}</strong></span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Work Order Form */}
          {action.formType === 'workOrder' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Finished Goods Part (Molded Component) *
                  </label>
                  <select
                    value={woFgItem}
                    onChange={(e) => setWoFgItem(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#0F8B8D]"
                    required
                  >
                    <option>FG-BUMP-01 (Molded Auto Front Grille PP-T20)</option>
                    <option>FG-MED-VIAL (Medical Vial Polypropylene Natural)</option>
                    <option>FG-BAT-CASE (Auto Battery Casing HDPE Impact)</option>
                    <option>FG-CAP-38MM (Beverage Bottle Closure HDPE)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Planned Production Quantity (Pcs) *
                  </label>
                  <input
                    type="number"
                    value={woQty}
                    onChange={(e) => setWoQty(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F8B8D]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Start Date *
                  </label>
                  <input
                    type="date"
                    value={woDate}
                    onChange={(e) => setWoDate(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F8B8D]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Injection Molding Machine *
                  </label>
                  <select
                    value={woMachine}
                    onChange={(e) => setWoMachine(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#0F8B8D]"
                    required
                  >
                    <option>IMM-ENGEL-650 (650T Engel Victory)</option>
                    <option>IMM-HAITIAN-450 (450T Haitian Mars II)</option>
                    <option>IMM-FANUC-100 (100T Fanuc Roboshot All-Electric)</option>
                    <option>IMM-KM-350 (350T KraussMaffei CX)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tooling / Mold Die *
                  </label>
                  <select
                    value={woMold}
                    onChange={(e) => setWoMold(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#0F8B8D]"
                    required
                  >
                    <option>MLD-AUTO-09 (2-Cavity Hot Runner Grille)</option>
                    <option>MLD-MED-64C (64-Cavity Precision Vial)</option>
                    <option>MLD-BAT-04C (4-Cavity Heavy Battery Casing)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={woPriority}
                    onChange={(e) => setWoPriority(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option>Urgent</option>
                    <option>High</option>
                    <option>Standard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Resin Source Silo / Location
                  </label>
                  <input
                    type="text"
                    value={woLocation}
                    onChange={(e) => setWoLocation(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </>
          )}

          {/* Purchase Requisition Form */}
          {action.formType === 'purchaseReq' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Raw Material / Additive Item *
                  </label>
                  <select
                    value={prItem}
                    onChange={(e) => setPrItem(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    required
                  >
                    <option>RM-PP-CP01 (Sabic PP Copolymer 579S - MFI 12)</option>
                    <option>RM-HDPE-BM (IOCL HDPE Blow Molding Grade 012DB54)</option>
                    <option>MB-BLK-04 (Polyone Black Masterbatch 40% Jet)</option>
                    <option>ADD-UV-01 (Cyasorb UV Stabilizer Additive)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Required Quantity (KG) *
                  </label>
                  <input
                    type="number"
                    value={prQty}
                    onChange={(e) => setPrQty(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Required Delivery Date *
                  </label>
                  <input
                    type="date"
                    value={prDate}
                    onChange={(e) => setPrDate(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Supplier Recommendation
                  </label>
                  <input
                    type="text"
                    value={prSupplier}
                    onChange={(e) => setPrSupplier(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Justification & Work Order Mapping
                  </label>
                  <textarea
                    value={prJustification}
                    onChange={(e) => setPrJustification(e.target.value)}
                    rows={2}
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </>
          )}

          {/* Maintenance Request Form */}
          {action.formType === 'maintenanceReq' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Machine / Press *
                  </label>
                  <select
                    value={maintMachine}
                    onChange={(e) => setMaintMachine(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    required
                  >
                    <option>IMM-KM-350 (350T KraussMaffei CX)</option>
                    <option>IMM-ENGEL-650 (650T Engel Victory)</option>
                    <option>IMM-HAITIAN-450 (450T Haitian Mars II)</option>
                    <option>CHILLER-CENTRAL-01 (150 TR Central Chiller)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Problem Type *
                  </label>
                  <select
                    value={maintProblem}
                    onChange={(e) => setMaintProblem(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option>Heater Band / Electrical</option>
                    <option>Hydraulic Oil Leak / Valve</option>
                    <option>Proportional Servo Motor Alarm</option>
                    <option>Ejector Pin Bending / Mold Jam</option>
                    <option>Chilled Water Circuit Low Flow</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Severity / Priority
                  </label>
                  <select
                    value={maintPriority}
                    onChange={(e) => setMaintPriority(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option>Critical (Press Stopped)</option>
                    <option>High (Impending Breakdown)</option>
                    <option>Medium (Scheduled PM)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Description of Anomaly
                  </label>
                  <textarea
                    value={maintDesc}
                    onChange={(e) => setMaintDesc(e.target.value)}
                    rows={2}
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {/* NCR Form */}
          {action.formType === 'ncr' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Item / Batch Affected *
                  </label>
                  <input
                    type="text"
                    value={ncrItem}
                    onChange={(e) => setNcrItem(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Plastic Defect Category *
                  </label>
                  <select
                    value={ncrDefect}
                    onChange={(e) => setNcrDefect(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option>Sink Marks & Warpage</option>
                    <option>Short Shot (Incomplete Filling)</option>
                    <option>Flash / Parting Line Burrs</option>
                    <option>Silver Streaks (Moisture in Resin)</option>
                    <option>Weld Line Weakness</option>
                    <option>Color Shade Shift (Delta-E &gt; 1.2)</option>
                    <option>Black Specks (Degraded Carbon)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Suspect Quantity (Pcs) *
                  </label>
                  <input
                    type="number"
                    value={ncrQty}
                    onChange={(e) => setNcrQty(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Defect Description & Immediate Disposition
                  </label>
                  <textarea
                    value={ncrDesc}
                    onChange={(e) => setNcrDesc(e.target.value)}
                    rows={2}
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {/* Downtime Form */}
          {action.formType === 'downtime' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Machine Work Center *
                  </label>
                  <select
                    value={dtMachine}
                    onChange={(e) => setDtMachine(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option>IMM-ENGEL-650 (650T Engel Victory)</option>
                    <option>IMM-HAITIAN-450 (450T Haitian Mars II)</option>
                    <option>IMM-KM-350 (350T KraussMaffei CX)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Stoppage Duration (Minutes) *
                  </label>
                  <input
                    type="number"
                    value={dtDuration}
                    onChange={(e) => setDtDuration(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Reason Code *
                  </label>
                  <select
                    value={dtReason}
                    onChange={(e) => setDtReason(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option>Mold Changeover & Barrel Purging</option>
                    <option>Material Starvation / Silo Blockage</option>
                    <option>Heater Band Burnout</option>
                    <option>Hydraulic Oil Pressure Drop</option>
                    <option>Robotic Sprue Picker Jam</option>
                    <option>Quality Parameter Re-tuning</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Operator Notes
                  </label>
                  <input
                    type="text"
                    value={dtNotes}
                    onChange={(e) => setDtNotes(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </>
          )}

          {/* Receive Goods (GRN) Form */}
          {action.formType === 'receiveGoods' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Purchase Order Reference *
                  </label>
                  <input
                    type="text"
                    value={grnPo}
                    onChange={(e) => setGrnPo(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Polymer Lot Number *
                  </label>
                  <input
                    type="text"
                    value={grnLot}
                    onChange={(e) => setGrnLot(e.target.value)}
                    className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Received Quantity (KG) *
                  </label>
                  <input
                    type="number"
                    value={grnQty}
                    onChange={(e) => setGrnQty(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Silo / Warehouse Bay *
                  </label>
                  <input
                    type="text"
                    value={grnBin}
                    onChange={(e) => setGrnBin(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {/* Fallback generic custom form */}
          {!['workOrder', 'purchaseReq', 'maintenanceReq', 'ncr', 'downtime', 'receiveGoods'].includes(action.formType) && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reference Identifier
                </label>
                <input
                  type="text"
                  defaultValue={`REF-${Date.now().toString().slice(-6)}`}
                  className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Operational Parameters / Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Specify details, batch references, or target quantities..."
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#0F8B8D] hover:bg-[#0c7274] shadow-md transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Execute {action.name}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
