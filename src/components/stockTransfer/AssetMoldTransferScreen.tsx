import React, { useState } from 'react';
import {
  Wrench,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  Calendar,
  Building2,
  Clock,
  Plus,
  ShieldCheck,
  Search,
  Truck,
  ArrowRight,
  Eye,
  Sliders,
  Cpu,
} from 'lucide-react';
import {
  AssetMoldItem,
  StockTransferRecord,
  UserRolePerspective,
} from '../../types/stockTransferTypes';
import { MASTER_MOLDS_CATALOG } from '../../data/stockTransferData';

interface AssetMoldTransferScreenProps {
  transfers?: StockTransferRecord[];
  currentUserRole?: UserRolePerspective;
  onInitiateAssetTransfer?: (asset: AssetMoldItem) => void;
  onSelectTransferForTracking?: (transfer: StockTransferRecord) => void;
  showToast?: (msg: string) => void;
}

export const AssetMoldTransferScreen: React.FC<AssetMoldTransferScreenProps> = ({
  transfers = [],
  currentUserRole = 'Logistics & Dispatch Manager',
  onInitiateAssetTransfer = (_asset?: AssetMoldItem) => {},
  onSelectTransferForTracking = (_transfer?: StockTransferRecord) => {},
  showToast = (_msg?: string) => {},
}) => {
  const [selectedMold, setSelectedMold] = useState<AssetMoldItem>(MASTER_MOLDS_CATALOG[0]);
  const [activeTab, setActiveTab] = useState<'REGISTRY' | 'TRANSFERS'>('REGISTRY');
  const [showPassportModal, setShowPassportModal] = useState<boolean>(false);
  const [showChallanModal, setShowChallanModal] = useState<boolean>(false);

  // Filter asset transfers
  const safeTransfers = transfers || [];
  const assetTransfers = safeTransfers.filter((t) => t.transferType === 'ASSET_MOLD');

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
              Tooling &amp; Engineering Registry
            </span>
            <span className="text-xs text-slate-500 font-medium">Screen 7: Static Asset Movement</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">
            Asset &amp; Mold Transfer Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Serialized tracking of high-value Injection Molds, Extrusion Dies, and Machinery with Tool Room handover sign-offs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveTab('REGISTRY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'REGISTRY' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mold Passports ({MASTER_MOLDS_CATALOG.length})
            </button>
            <button
              onClick={() => setActiveTab('TRANSFERS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'TRANSFERS' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active Transfers ({assetTransfers.length})
            </button>
          </div>

          <button
            onClick={() => onInitiateAssetTransfer(selectedMold)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Transfer Selected Mold
          </button>
        </div>
      </div>

      {activeTab === 'REGISTRY' ? (
        /* Registry & Mold Passports Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {MASTER_MOLDS_CATALOG.map((mold) => {
            const isSelected = selectedMold.assetId === mold.assetId;
            const shotLifePct = Math.round((mold.currentShotCount / mold.ratedShotLife) * 100);

            return (
              <div
                key={mold.assetId}
                onClick={() => setSelectedMold(mold)}
                className={`bg-white rounded-2xl border-2 transition-all cursor-pointer overflow-hidden shadow-sm flex flex-col justify-between ${
                  isSelected ? 'border-purple-600 ring-2 ring-purple-100' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Mold Image / Hero */}
                  <div className="relative h-40 bg-slate-100 overflow-hidden">
                    <img
                      src={mold.imageThumbnail}
                      alt={mold.moldName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
                    <div className="absolute top-3 left-3">
                      <span className="font-mono text-xs font-black text-white bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-white/20">
                        {mold.assetId}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          mold.maintenanceStatus === 'OK'
                            ? 'bg-emerald-500 text-white'
                            : mold.maintenanceStatus === 'Needs Service'
                            ? 'bg-amber-500 text-white'
                            : 'bg-rose-500 text-white'
                        }`}
                      >
                        {mold.maintenanceStatus}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h3 className="text-sm font-bold truncate">{mold.moldName}</h3>
                      <div className="text-[11px] text-slate-300 font-mono">SN: {mold.serialNumber}</div>
                    </div>
                  </div>

                  {/* Mold Passport Specs */}
                  <div className="p-4 space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-slate-500 text-[11px]">Cavities / Type:</span>
                        <div className="font-bold text-slate-900 mt-0.5">
                          {mold.cavities} Cavities ({mold.assetType})
                        </div>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-slate-500 text-[11px]">Required Tonnage:</span>
                        <div className="font-bold text-slate-900 mt-0.5">{mold.tonnageRequired}</div>
                      </div>
                    </div>

                    {/* Shot Count Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">Recorded Tool Shot Count:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {mold.currentShotCount.toLocaleString()} / {mold.ratedShotLife.toLocaleString()} ({shotLifePct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            shotLifePct > 80 ? 'bg-amber-500' : 'bg-purple-600'
                          }`}
                          style={{ width: `${shotLifePct}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600 space-y-1 pt-1">
                      <div>
                        <strong>Compatible Presses:</strong> {mold.compatibleMachines.join(', ')}
                      </div>
                      <div>
                        <strong>Insurance Declared:</strong> ₹{(mold.insuranceDeclaredValue / 100000).toFixed(1)} Lakh
                      </div>
                      <div>
                        <strong>Last Maintenance:</strong> {mold.lastMaintenanceDate}
                      </div>
                    </div>

                    <div className="p-2 bg-purple-50 rounded-lg border border-purple-100 text-[11px] text-purple-900">
                      <strong>Rigging Note:</strong> {mold.transportInstructions}
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setSelectedMold(mold);
                      setShowPassportModal(true);
                    }}
                    className="text-xs text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> Full Passport
                  </button>
                  <button
                    onClick={() => onInitiateAssetTransfer(mold)}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                  >
                    Transfer Asset &rarr;
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Active Asset Transfers Table */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5 font-bold">Transfer Note</th>
                <th className="py-3 px-3 font-bold">Asset / Mold</th>
                <th className="py-3 px-3 font-bold">From Location &rarr; To Location</th>
                <th className="py-3 px-3 font-bold">Shot Count</th>
                <th className="py-3 px-3 font-bold">Vehicle &amp; Riggers</th>
                <th className="py-3 px-3 font-bold">Tool Room Sign-Off</th>
                <th className="py-3 px-3 font-bold text-center">Status</th>
                <th className="py-3 px-3.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assetTransfers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No active asset transfers found.
                  </td>
                </tr>
              ) : (
                assetTransfers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3.5 font-mono font-bold text-purple-700">{t.id}</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">
                        {t.assetDetails?.assetId} - {t.assetDetails?.moldName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        SN: {t.assetDetails?.serialNumber}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{t.fromStoreName}</div>
                      <div className="text-[11px] text-slate-500">&darr; {t.toStoreName} ({t.toPlantName})</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-700">
                      {t.assetDetails?.currentShotCount.toLocaleString()} Shots
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-slate-800">
                        {t.logistics?.vehicleNumber || 'Rigging Truck'}
                      </div>
                      <div className="text-[11px] text-slate-500">{t.logistics?.transporterName}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Handover Signed
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {t.assetDetails?.toolRoomManagerSignature?.signedBy || 'Mahesh Kulkarni'}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                        {t.assetStatus || t.status}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right space-x-1">
                      <button
                        onClick={() => setShowChallanModal(true)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 rounded"
                        title="Print Asset Movement DC"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onSelectTransferForTracking(t)}
                        className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-bold"
                      >
                        Track
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Full Mold Passport Modal */}
      {showPassportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-purple-700">{selectedMold.assetId}</span>
                <h3 className="text-base font-bold text-slate-900">Engineering Mold Passport</h3>
              </div>
              <button onClick={() => setShowPassportModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="h-44 rounded-xl overflow-hidden bg-slate-100">
                <img
                  src={selectedMold.imageThumbnail}
                  alt={selectedMold.moldName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>Mold Name: <strong>{selectedMold.moldName}</strong></div>
                <div>Serial Number: <strong className="font-mono">{selectedMold.serialNumber}</strong></div>
                <div>Cavities: <strong>{selectedMold.cavities}</strong></div>
                <div>Tonnage Required: <strong>{selectedMold.tonnageRequired}</strong></div>
                <div>Current Life: <strong>{selectedMold.currentShotCount.toLocaleString()} / {selectedMold.ratedShotLife.toLocaleString()}</strong></div>
                <div>Insurance Value: <strong>₹{selectedMold.insuranceDeclaredValue.toLocaleString('en-IN')}</strong></div>
              </div>

              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-900">
                <div className="font-bold mb-1">Preventative Maintenance &amp; Handover Directive:</div>
                <div>• Last Serviced: {selectedMold.lastMaintenanceDate}</div>
                <div>• Transport: {selectedMold.transportInstructions}</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowPassportModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowPassportModal(false);
                  onInitiateAssetTransfer(selectedMold);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Initiate Transfer Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Asset Movement Delivery Challan Print Modal */}
      {showChallanModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">Delivery Challan for Asset / Tooling Movement</h3>
              <button onClick={() => setShowChallanModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <div className="border border-slate-300 p-4 rounded-xl text-xs space-y-3 font-sans">
              <div className="p-2 bg-purple-50 border border-purple-200 rounded text-center font-bold text-purple-900">
                "Non-Commercial Movement of Capital Tooling for Job-Work / Captive Production"
              </div>

              <div className="flex justify-between">
                <div>
                  <div className="font-bold">Unit 1 - Pimpri Auto-Plastics</div>
                  <div className="text-slate-500 text-[11px]">Central Tool Room Division</div>
                </div>
                <div className="text-right font-mono">
                  <div className="font-bold text-purple-700">ATN-2026-00012</div>
                  <div className="text-slate-500 text-[11px]">Date: 2026-09-12</div>
                </div>
              </div>

              <div className="p-3 border rounded space-y-1">
                <div className="font-bold">{selectedMold.assetId} - {selectedMold.moldName}</div>
                <div>Serial Number: <strong className="font-mono">{selectedMold.serialNumber}</strong></div>
                <div>Recorded Shot Count: <strong>{selectedMold.currentShotCount.toLocaleString()}</strong></div>
                <div>Declared Insurance Value: <strong>₹{selectedMold.insuranceDeclaredValue.toLocaleString('en-IN')}</strong></div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-200 text-center text-[10px]">
                <div>
                  <div className="border-b border-slate-400 h-8 mb-1" />
                  <span>Dispatched: Tool Room Manager</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 h-8 mb-1" />
                  <span>Received: Plant Production Manager</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowChallanModal(false)} className="px-4 py-2 bg-slate-100 rounded-lg text-xs">
                Close
              </button>
              <button
                onClick={() => {
                  showToast('Printed Asset Movement Challan.');
                  setShowChallanModal(false);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" /> Print Challan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
