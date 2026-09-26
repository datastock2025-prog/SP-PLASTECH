import React, { useState, useEffect } from 'react';
import { offlineSyncService } from '../../services/sync.service';

interface ProductionLogPayload {
  machineId: string;
  moldId: string;
  workOrderId: string;
  shotCount: number;
  goodPartsCount: number;
  scrapCount: number;
  scrapReason?: string;
  operatorId: string;
}

export const ShopFloorProductionEntry: React.FC = () => {
  const [machineId, setMachineId] = useState('IMM-04');
  const [workOrderId, setWorkOrderId] = useState('WO-2026-0891');
  const [goodCount, setGoodCount] = useState<number>(0);
  const [scrapCount, setScrapCount] = useState<number>(0);
  const [scrapReason, setScrapReason] = useState<string>('FLASH');
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [submittedStatus, setSubmittedStatus] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSubmit = async () => {
    const payload: ProductionLogPayload = {
      machineId,
      moldId: 'MOLD-PET-500ML-02',
      workOrderId,
      shotCount: goodCount + scrapCount,
      goodPartsCount: goodCount,
      scrapCount,
      scrapReason: scrapCount > 0 ? scrapReason : undefined,
      operatorId: 'OP-4412',
    };

    try {
      await offlineSyncService.enqueueOutbox('/api/v1/operations/production-log', 'POST', payload);
      setSubmittedStatus(isOnline ? 'Entry saved & synced live!' : 'Entry queued locally in Outbox (Offline)');
      setGoodCount(0);
      setScrapCount(0);
      setTimeout(() => setSubmittedStatus(null), 4000);
    } catch (err: any) {
      setSubmittedStatus(`Failed: ${err.message}`);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div>
          <h1 className="text-xl font-black text-amber-400 tracking-wider">SHOP FLOOR DISPATCH</h1>
          <p className="text-xs text-slate-400">Bay: Injection Molding | Machine: {machineId}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`h-3 w-3 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <span className="text-xs font-bold uppercase tracking-wider">{isOnline ? 'ONLINE' : 'OFFLINE MODE'}</span>
        </div>
      </div>

      {submittedStatus && (
        <div className="mb-4 p-3 bg-cyan-950 border border-cyan-500 text-cyan-200 text-center font-bold text-sm rounded-lg">
          {submittedStatus}
        </div>
      )}

      {/* Inputs Section */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Work Order</label>
          <input
            type="text"
            value={workOrderId}
            onChange={(e) => setWorkOrderId(e.target.value)}
            className="w-full bg-slate-800 text-amber-300 font-mono text-lg font-bold p-3 rounded-lg border border-slate-700 text-center"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Machine</label>
          <input
            type="text"
            value={machineId}
            onChange={(e) => setMachineId(e.target.value)}
            className="w-full bg-slate-800 text-white font-mono text-lg font-bold p-3 rounded-lg border border-slate-700 text-center"
          />
        </div>
      </div>

      {/* Production Count Incrementers */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Good Parts */}
        <div className="bg-emerald-950/40 border-2 border-emerald-600/50 p-4 rounded-xl text-center">
          <span className="text-xs font-black text-emerald-400 tracking-wider">GOOD PARTS</span>
          <div className="text-4xl font-mono font-black text-emerald-300 my-2">{goodCount}</div>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setGoodCount((c) => Math.max(0, c - 10))}
              className="px-3 py-2 bg-emerald-900 text-emerald-200 font-bold rounded-lg hover:bg-emerald-800 text-base"
            >
              -10
            </button>
            <button
              onClick={() => setGoodCount((c) => c + 1)}
              className="px-4 py-2 bg-emerald-600 text-white font-black rounded-lg hover:bg-emerald-500 text-xl"
            >
              +1
            </button>
            <button
              onClick={() => setGoodCount((c) => c + 10)}
              className="px-3 py-2 bg-emerald-700 text-white font-bold rounded-lg hover:bg-emerald-600 text-base"
            >
              +10
            </button>
          </div>
        </div>

        {/* Scrap Parts */}
        <div className="bg-rose-950/40 border-2 border-rose-600/50 p-4 rounded-xl text-center">
          <span className="text-xs font-black text-rose-400 tracking-wider">SCRAP / REJECTS</span>
          <div className="text-4xl font-mono font-black text-rose-300 my-2">{scrapCount}</div>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setScrapCount((c) => Math.max(0, c - 1))}
              className="px-3 py-2 bg-rose-900 text-rose-200 font-bold rounded-lg hover:bg-rose-800 text-base"
            >
              -1
            </button>
            <button
              onClick={() => setScrapCount((c) => c + 1)}
              className="px-4 py-2 bg-rose-600 text-white font-black rounded-lg hover:bg-rose-500 text-xl"
            >
              +1
            </button>
            <button
              onClick={() => setScrapCount((c) => c + 5)}
              className="px-3 py-2 bg-rose-700 text-white font-bold rounded-lg hover:bg-rose-600 text-base"
            >
              +5
            </button>
          </div>
        </div>
      </div>

      {/* Scrap Defect Selector */}
      {scrapCount > 0 && (
        <div className="mb-6 p-3 bg-slate-800/80 rounded-lg border border-slate-700">
          <label className="block text-xs font-bold text-rose-400 uppercase mb-2">Defect Reason</label>
          <div className="grid grid-cols-4 gap-2 text-xs font-bold">
            {['FLASH', 'SHORT_SHOT', 'BURNT_MARK', 'WARPAGE', 'SINK_MARK', 'COLOR_STREAK', 'CONTAMINATION', 'OTHER'].map(
              (reason) => (
                <button
                  key={reason}
                  onClick={() => setScrapReason(reason)}
                  className={`py-2 px-1 rounded text-center transition-all ${
                    scrapReason === reason
                      ? 'bg-rose-600 text-white shadow-lg'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {reason.replace('_', ' ')}
                </button>
              ),
            )}
          </div>
        </div>
      )}

      {/* Large Submit Button */}
      <button
        onClick={handleSubmit}
        className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xl rounded-xl shadow-xl active:scale-[0.98] transition-all tracking-wider uppercase"
      >
        SUBMIT PRODUCTION BATCH
      </button>
    </div>
  );
};
