import React, { useState, useEffect } from 'react';
import { WorkOrder, MachineMaster, ItemMaster } from '../../types';
import {
  Zap,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCcw,
  User,
  Wifi,
  WifiOff,
  Plus,
  Minus,
  Check,
  X,
  Layers,
  FileText,
  ShieldCheck,
  Camera,
  CornerUpLeft
} from 'lucide-react';

interface KioskProps {
  workOrders: WorkOrder[];
  machines: MachineMaster[];
  items: ItemMaster[];
  selectedWoId?: string;
  onNavigate: (view: string, param?: any) => void;
  onUpdateWO: (wo: WorkOrder) => void;
  showToast: (msg: string) => void;
}

export const ShopFloorKiosk: React.FC<KioskProps> = ({
  workOrders,
  machines,
  items,
  selectedWoId,
  onNavigate,
  onUpdateWO,
  showToast,
}) => {
  const [activeWOId, setActiveWOId] = useState<string>(selectedWoId || 'WO-1188');
  const [activeModal, setActiveModal] = useState<'output' | 'downtime' | 'scrap' | 'quality' | 'switchUser' | null>(null);
  const [currentOperator, setCurrentOperator] = useState<string>('Rajesh Kumar (OP-441)');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineQueue, setOfflineQueue] = useState<number>(0);

  // Keypad & Entry states
  const [keypadVal, setKeypadVal] = useState<string>('50');
  const [scrapKeypadVal, setScrapKeypadVal] = useState<string>('0');
  const [selectedDowntimeCategory, setSelectedDowntimeCategory] = useState<string>('Equipment Failure');
  const [selectedDowntimeSub, setSelectedDowntimeSub] = useState<string>('Mechanical Breakdown');
  const [downtimeMinutes, setDowntimeMinutes] = useState<number>(15);
  const [recentUndoableAction, setRecentUndoableAction] = useState<{ id: string; good: number; scrap: number } | null>(null);

  const wo = workOrders.find((w) => w.id === activeWOId) || workOrders[0];
  const itemName = (code: string) => items.find((i) => i.code === code)?.name || code;
  const progressPct = Math.min(100, Math.round((wo.completed / wo.qty) * 100));

  const handleKeypadPress = (digit: string) => {
    if (digit === 'C') {
      setKeypadVal('');
    } else if (digit === 'DEL') {
      setKeypadVal((prev) => prev.slice(0, -1));
    } else {
      setKeypadVal((prev) => (prev === '0' ? digit : prev + digit));
    }
  };

  const handleConfirmOutput = () => {
    const goodQty = parseInt(keypadVal) || 0;
    const scrapQty = parseInt(scrapKeypadVal) || 0;

    if (goodQty === 0 && scrapQty === 0) {
      showToast('Please enter production quantity');
      return;
    }

    const updatedCompleted = wo.completed + goodQty;
    const updatedScrap = wo.scrap + scrapQty;
    const newLog = {
      time: 'Just now',
      good: goodQty,
      scrap: scrapQty,
      by: currentOperator,
    };

    onUpdateWO({
      ...wo,
      completed: updatedCompleted,
      scrap: updatedScrap,
      outputLogs: [newLog, ...(wo.outputLogs || [])],
    });

    setRecentUndoableAction({ id: wo.id, good: goodQty, scrap: scrapQty });
    setActiveModal(null);
    setKeypadVal('50');
    setScrapKeypadVal('0');
    showToast(`Logged +${goodQty} Good, +${scrapQty} Scrap on ${wo.id}`);

    // Auto clear undo after 30s
    setTimeout(() => {
      setRecentUndoableAction(null);
    }, 30000);
  };

  const handleUndo = () => {
    if (!recentUndoableAction) return;
    const updatedCompleted = Math.max(0, wo.completed - recentUndoableAction.good);
    const updatedScrap = Math.max(0, wo.scrap - recentUndoableAction.scrap);
    onUpdateWO({
      ...wo,
      completed: updatedCompleted,
      scrap: updatedScrap,
    });
    setRecentUndoableAction(null);
    showToast('Last entry successfully undone.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 select-none">
      {/* High-Contrast Operator Header Bar */}
      <div className="bg-[#14213D] text-white p-4 rounded-3xl shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E8622C] flex items-center justify-center font-bold text-white shadow-xs">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-wider uppercase text-[#E8622C]">
              Shop Floor Kiosk &bull; Terminal Bay 3
            </div>
            <div className="font-bold text-sm flex items-center gap-2">
              <span>{currentOperator}</span>
              <button
                onClick={() => setActiveModal('switchUser')}
                className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded-md text-slate-200 transition-colors"
              >
                Switch Operator PIN
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Online/Offline Status Indicator */}
          <div
            onClick={() => setIsOnline(!isOnline)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
              isOnline ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
            }`}
          >
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span>{isOnline ? 'Online Synced' : 'Offline Mode (Queued)'}</span>
          </div>

          <button
            onClick={() => onNavigate('mfgDash')}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white"
          >
            Exit Kiosk
          </button>
        </div>
      </div>

      {/* Undo Banner if an entry was made within 30 sec */}
      {recentUndoableAction && (
        <div className="p-3 bg-amber-100 border border-amber-300 text-amber-900 rounded-2xl flex items-center justify-between text-xs animate-in slide-in-from-top-2">
          <span>
            Logged +{recentUndoableAction.good} Good / +{recentUndoableAction.scrap} Scrap.
          </span>
          <button
            onClick={handleUndo}
            className="px-3 py-1 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-lg flex items-center gap-1"
          >
            <CornerUpLeft className="w-3.5 h-3.5" /> Undo Last Entry (30s)
          </button>
        </div>
      )}

      {/* Big Active Job Display Card */}
      <div className="bg-white rounded-3xl border-2 border-[#14213D] p-6 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E4E0D6]">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-black text-[#0F8B8D]">{wo.id}</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                {wo.machine || 'IMM-250T-03'} &bull; {wo.shift || 'Shift A'}
              </span>
            </div>
            <h2 className="text-xl font-black text-[#14213D] mt-1">{itemName(wo.item)}</h2>
          </div>

          {/* Quick Select Job dropdown */}
          <select
            value={wo.id}
            onChange={(e) => setActiveWOId(e.target.value)}
            className="p-2 rounded-xl border border-[#E4E0D6] bg-[#F6F4EF] text-xs font-bold text-[#14213D]"
          >
            {workOrders.map((w) => (
              <option key={w.id} value={w.id}>{w.id} &mdash; {itemName(w.item)}</option>
            ))}
          </select>
        </div>

        {/* Big Progress Display */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <div className="text-2xl font-black text-[#14213D]">
              {wo.completed.toLocaleString()} <span className="text-sm font-normal text-[#6B7280]">/ {wo.qty.toLocaleString()} {wo.uom}</span>
            </div>
            <div className="text-2xl font-black text-[#0F8B8D]">{progressPct}%</div>
          </div>
          <div className="w-full bg-[#E4E0D6] h-5 rounded-full overflow-hidden p-0.5">
            <div
              className="bg-[#0F8B8D] h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Live Cycle Time & Rate Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-2xl bg-[#F6F4EF] text-center">
            <div className="text-[11px] font-bold text-[#6B7280]">Live Cycle Time</div>
            <div className="text-lg font-black text-[#14213D]">12.3s <span className="text-xs font-normal text-[#6B7280]">(Std 12.0s)</span></div>
          </div>
          <div className="p-3 rounded-2xl bg-[#F6F4EF] text-center">
            <div className="text-[11px] font-bold text-[#6B7280]">Shots / Hour</div>
            <div className="text-lg font-black text-[#1F8A5F]">284 <span className="text-xs font-normal text-[#6B7280]">(Target 300)</span></div>
          </div>
          <div className="p-3 rounded-2xl bg-[#F6F4EF] text-center">
            <div className="text-[11px] font-bold text-[#6B7280]">Scrap Count</div>
            <div className="text-lg font-black text-[#C4433A]">{wo.scrap} pcs</div>
          </div>
          <div className="p-3 rounded-2xl bg-[#F6F4EF] text-center">
            <div className="text-[11px] font-bold text-[#6B7280]">Mold Cavities</div>
            <div className="text-lg font-black text-[#14213D]">4 Cavities</div>
          </div>
        </div>
      </div>

      {/* High Contrast 6-Button Touch Grid (Min 56px Touch Target for Gloves) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setActiveModal('output')}
          className="h-24 rounded-3xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-lg flex flex-col items-center justify-center gap-1 shadow-md transition-all"
        >
          <span>RECORD OUTPUT</span>
          <span className="text-xs font-normal opacity-90">+Good Units / Cartons</span>
        </button>

        <button
          onClick={() => setActiveModal('downtime')}
          className="h-24 rounded-3xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-black text-lg flex flex-col items-center justify-center gap-1 shadow-md transition-all"
        >
          <span>LOG DOWNTIME</span>
          <span className="text-xs font-normal opacity-90">Breakdown / Mold / Purge</span>
        </button>

        <button
          onClick={() => setActiveModal('scrap')}
          className="h-24 rounded-3xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-lg flex flex-col items-center justify-center gap-1 shadow-md transition-all"
        >
          <span>REPORT SCRAP</span>
          <span className="text-xs font-normal opacity-90">Flash / Short Shot / Defect</span>
        </button>

        <button
          onClick={() => onNavigate('qualityInspection', { id: wo.id })}
          className="h-20 rounded-3xl bg-[#14213D] hover:bg-[#1f3158] active:scale-95 text-white font-bold text-base flex flex-col items-center justify-center gap-0.5 shadow-md transition-all"
        >
          <span>QUALITY CHECK</span>
          <span className="text-xs font-normal opacity-80">Hourly Gauge Check</span>
        </button>

        <button
          onClick={() => onNavigate('materialIssuing', { id: wo.id })}
          className="h-20 rounded-3xl bg-[#0F8B8D] hover:bg-[#0c7072] active:scale-95 text-white font-bold text-base flex flex-col items-center justify-center gap-0.5 shadow-md transition-all"
        >
          <span>MATERIAL REQUEST</span>
          <span className="text-xs font-normal opacity-80">Call Warehouse Hopper</span>
        </button>

        <button
          onClick={() => {
            if (window.confirm(`Complete & Close Work Order ${wo.id}?`)) {
              onUpdateWO({ ...wo, status: 'completed' });
              showToast(`Work Order ${wo.id} marked COMPLETED.`);
            }
          }}
          className="h-20 rounded-3xl bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-bold text-base flex flex-col items-center justify-center gap-0.5 shadow-md transition-all"
        >
          <span>COMPLETE JOB</span>
          <span className="text-xs font-normal opacity-80">Final Batch Close</span>
        </button>
      </div>

      {/* Output Entry Modal with Glove-Friendly Numeric Keypad */}
      {activeModal === 'output' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E4E0D6] p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D6]">
              <h3 className="text-lg font-black text-[#14213D]">Record Output &mdash; {wo.id}</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-full bg-[#F6F4EF]">
                <X className="w-5 h-5 text-[#6B7280]" />
              </button>
            </div>

            {/* Display Box */}
            <div className="p-4 rounded-2xl bg-[#F6F4EF] text-center">
              <div className="text-xs text-[#6B7280] font-bold">Good Produced Quantity</div>
              <div className="text-4xl font-mono font-black text-[#14213D] mt-1">
                {keypadVal || '0'} <span className="text-base font-normal text-[#6B7280]">{wo.uom}</span>
              </div>
            </div>

            {/* Numeric Keypad Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'DEL'].map((btn) => (
                <button
                  key={btn}
                  onClick={() => handleKeypadPress(btn)}
                  className={`h-14 rounded-2xl font-black text-xl flex items-center justify-center transition-transform active:scale-95 shadow-xs ${
                    btn === 'C'
                      ? 'bg-rose-100 text-rose-800'
                      : btn === 'DEL'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-[#F6F4EF] hover:bg-[#FAF9F5] text-[#14213D] border border-[#E4E0D6]'
                  }`}
                >
                  {btn}
                </button>
              ))}
            </div>

            {/* Preset Fast Quick-Tap Buttons */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button onClick={() => setKeypadVal('50')} className="py-2 rounded-xl bg-slate-100 text-xs font-bold">+50 Box</button>
              <button onClick={() => setKeypadVal('200')} className="py-2 rounded-xl bg-slate-100 text-xs font-bold">+200 Pallet</button>
              <button onClick={() => setKeypadVal('500')} className="py-2 rounded-xl bg-slate-100 text-xs font-bold">+500 Lot</button>
            </div>

            <button
              onClick={handleConfirmOutput}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-md transition-colors"
            >
              CONFIRM &amp; LOG OUTPUT
            </button>
          </div>
        </div>
      )}

      {/* Downtime Logging Modal */}
      {activeModal === 'downtime' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E4E0D6] p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D6]">
              <h3 className="text-lg font-black text-[#14213D]">Log Downtime Event</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-full bg-[#F6F4EF]">
                <X className="w-5 h-5 text-[#6B7280]" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#6B7280]">1. Top-Level Category</label>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                {['Equipment Failure', 'Tooling & Mold', 'Material & Feed', 'Changeover & Setup (SMED)'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedDowntimeCategory(cat)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedDowntimeCategory === cat
                        ? 'bg-amber-500 text-white border-amber-600 font-black'
                        : 'bg-[#F6F4EF] text-[#14213D] border-[#E4E0D6]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#6B7280]">2. Downtime Duration (Minutes)</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDowntimeMinutes(Math.max(5, downtimeMinutes - 5))}
                  className="w-12 h-12 rounded-xl bg-slate-200 font-black text-lg"
                >
                  -
                </button>
                <div className="flex-1 text-center font-mono font-black text-2xl text-[#14213D]">
                  {downtimeMinutes} min
                </div>
                <button
                  onClick={() => setDowntimeMinutes(downtimeMinutes + 5)}
                  className="w-12 h-12 rounded-xl bg-slate-200 font-black text-lg"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                const newDowntimeLog = {
                  time: 'Just now',
                  reason: `${selectedDowntimeCategory} - ${selectedDowntimeSub}`,
                  min: downtimeMinutes,
                  by: currentOperator
                };
                onUpdateWO({
                  ...wo,
                  downtimeMin: wo.downtimeMin + downtimeMinutes,
                  downtimeLogs: [newDowntimeLog, ...(wo.downtimeLogs || [])]
                });
                setActiveModal(null);
                showToast(`Logged ${downtimeMinutes} min downtime: ${selectedDowntimeCategory}`);
              }}
              className="w-full py-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-base shadow-md transition-colors"
            >
              SAVE DOWNTIME RECORD
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
