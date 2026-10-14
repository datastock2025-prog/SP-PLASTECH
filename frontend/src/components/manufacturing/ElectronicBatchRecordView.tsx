import React, { useState } from 'react';
import { WorkOrder, ItemMaster } from '../../types';
import {
  FileCheck,
  ShieldCheck,
  Download,
  CheckCircle2,
  AlertTriangle,
  Lock,
  UserCheck,
  FileText,
  Printer
} from 'lucide-react';

interface EBRProps {
  workOrders: WorkOrder[];
  items: ItemMaster[];
  selectedWoId?: string;
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const ElectronicBatchRecordView: React.FC<EBRProps> = ({
  workOrders,
  items,
  selectedWoId = 'WO-1188',
  onNavigate,
  showToast,
}) => {
  const [selectedWO, setSelectedWO] = useState<string>(selectedWoId);
  const [isSignModalOpen, setIsSignModalOpen] = useState<boolean>(false);
  const [signerRole, setSignerRole] = useState<string>('Quality Assurance Manager');
  const [signerPin, setSignerPin] = useState<string>('');

  const currentWO = workOrders.find((w) => w.id === selectedWO) || workOrders[0];
  const itemName = (code: string) => items.find((i) => i.code === code)?.name || code;

  const handleSignEBR = () => {
    if (!signerPin) {
      showToast('Please enter your 21 CFR Part 11 security PIN');
      return;
    }
    setIsSignModalOpen(false);
    showToast(`EBR digitally signed by Dr. Kavita Menon (${signerRole}) with cryptographic timestamp.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E4E0D6] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#0F8B8D]/10 text-[#0F8B8D]">
              FDA 21 CFR Part 11 &bull; Annex 11 Compliant
            </span>
            <span className="text-[11px] text-[#6B7280]">
              Immutable Audit Trail &bull; Dual Electronic Sign-off
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#14213D]">Electronic Batch Record (eBR Hub)</h1>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedWO}
            onChange={(e) => setSelectedWO(e.target.value)}
            className="p-2.5 rounded-xl border border-[#E4E0D6] bg-white font-bold text-xs text-[#14213D]"
          >
            {workOrders.map((w) => (
              <option key={w.id} value={w.id}>{w.id} &mdash; {itemName(w.item)}</option>
            ))}
          </select>

          <button
            onClick={() => setIsSignModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#0F8B8D] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-[#0c7072] transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            Digitally Sign EBR
          </button>
        </div>
      </div>

      {/* Main EBR Document Layout */}
      <div className="bg-white rounded-2xl border border-[#E4E0D6] p-6 shadow-xs space-y-6">
        {/* Document Meta Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E4E0D6]">
          <div>
            <div className="text-xs font-mono font-bold text-[#0F8B8D]">EBR RECORD ID: EBR-2026-0828-045</div>
            <h2 className="text-xl font-bold text-[#14213D] mt-0.5">{itemName(currentWO?.item || '')}</h2>
            <div className="text-xs text-[#6B7280]">
              Work Order: <b>{currentWO?.id}</b> &bull; Lot: <b>LOT-20260828-A1</b> &bull; Recipe: <b>BOM-1042-v2</b>
            </div>
          </div>

          <div className="text-right text-xs">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
              Ready for QA Release
            </span>
            <div className="text-[#6B7280] text-[11px] mt-1">Audit Trail Hash: SHA-256 Valid</div>
          </div>
        </div>

        {/* 1. Recipe Material Verification */}
        <div className="space-y-2">
          <h3 className="font-bold text-sm text-[#14213D] flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            1. Bill of Materials &amp; Lot Dispensing Verification
          </h3>
          <div className="p-3.5 bg-[#F6F4EF] rounded-xl border border-[#E4E0D6] text-xs space-y-1.5">
            <div className="flex justify-between">
              <span>PP Natural Granules (Virgin Lot LOT-001-01):</span>
              <b className="text-emerald-700">Dispensed 3,880 KG (Passed Gravimetric Verification)</b>
            </div>
            <div className="flex justify-between">
              <span>White Masterbatch (Lot LOT-MB-00456):</span>
              <b className="text-emerald-700">Dispensed 96 KG (2.0% Precision Dosing Verified)</b>
            </div>
          </div>
        </div>

        {/* 2. Critical Process Parameter Checkpoints */}
        <div className="space-y-2">
          <h3 className="font-bold text-sm text-[#14213D] flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            2. Critical Process Parameters (CPP) Telemetry Log
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#F6F4EF]">
              <div className="text-[#6B7280]">Peak Melt Temp</div>
              <div className="text-base font-mono font-bold text-[#14213D] mt-0.5">218.4 °C</div>
              <div className="text-[10px] text-emerald-700">Spec: 215±5 °C</div>
            </div>
            <div className="p-3 rounded-xl bg-[#F6F4EF]">
              <div className="text-[#6B7280]">Injection Pressure</div>
              <div className="text-base font-mono font-bold text-[#14213D] mt-0.5">848 bar</div>
              <div className="text-[10px] text-emerald-700">Spec: 850±30 bar</div>
            </div>
            <div className="p-3 rounded-xl bg-[#F6F4EF]">
              <div className="text-[#6B7280]">Cooling Cycle Time</div>
              <div className="text-base font-mono font-bold text-[#14213D] mt-0.5">8.1 sec</div>
              <div className="text-[10px] text-emerald-700">Spec: 8.0±0.5s</div>
            </div>
            <div className="p-3 rounded-xl bg-[#F6F4EF]">
              <div className="text-[#6B7280]">Clamping Tonnage</div>
              <div className="text-base font-mono font-bold text-[#14213D] mt-0.5">248 T</div>
              <div className="text-[10px] text-emerald-700">Spec: 250T Nom</div>
            </div>
          </div>
        </div>

        {/* 3. Deviation & Non-Conformance Log */}
        <div className="space-y-2">
          <h3 className="font-bold text-sm text-[#14213D] flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            3. Deviations &amp; Corrective Actions (CAPA)
          </h3>
          <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
            <b>Zero Critical Deviations:</b> All in-process sampling passed dimensional Cpk inspection (&gt;1.5). Zero OOS occurrences during batch run.
          </div>
        </div>

        {/* 4. Digital Signatures Panel */}
        <div className="pt-4 border-t border-[#E4E0D6] space-y-3">
          <h3 className="font-bold text-sm text-[#14213D]">21 CFR Part 11 Electronic Signatures</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#F6F4EF] border border-[#E4E0D6] space-y-1">
              <div className="font-bold text-[#14213D] flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Production Supervisor Sign-off
              </div>
              <div className="text-[11px] text-[#6B7280]">
                Signed by: <b>Anjali Sharma</b> (ID: OP-SUP-12) &bull; 2026-08-28 11:30 AM
              </div>
              <div className="font-mono text-[10px] text-slate-500 truncate">
                Signature ID: SHA256:8f4c2b9a77...e912
              </div>
            </div>

            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 space-y-1">
              <div className="font-bold text-purple-950 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-purple-700" /> QA Final Release Approval
              </div>
              <div className="text-[11px] text-purple-900">
                Signed by: <b>Dr. Kavita Menon</b> (QA Head) &bull; 2026-08-28 12:15 PM
              </div>
              <div className="font-mono text-[10px] text-purple-700 truncate">
                Signature ID: SHA256:2d18fe009a...7c41
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      {isSignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E4E0D6] p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#14213D]">21 CFR Part 11 Digital Signature</h3>
                <div className="text-xs text-[#6B7280]">Cryptographic batch release sign-off</div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#14213D] block mb-1">Signer Role</label>
                <select
                  value={signerRole}
                  onChange={(e) => setSignerRole(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E4E0D6] bg-white font-semibold"
                >
                  <option value="Quality Assurance Manager">Quality Assurance Manager</option>
                  <option value="Production Supervisor">Production Supervisor</option>
                  <option value="Plant Operations Director">Plant Operations Director</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#14213D] block mb-1">Enter Security PIN / Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={signerPin}
                  onChange={(e) => setSignerPin(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E4E0D6] font-mono text-center text-lg tracking-widest"
                />
              </div>

              <div className="p-3 bg-[#F6F4EF] rounded-xl text-[11px] text-[#6B7280]">
                By clicking "Apply Electronic Signature", I verify under penalty of perjury that the data contained in this Electronic Batch Record has been inspected and complies with all release specifications.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsSignModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSignEBR}
                className="px-4 py-2 rounded-xl bg-[#0F8B8D] text-white font-bold text-xs"
              >
                Apply Electronic Signature
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
