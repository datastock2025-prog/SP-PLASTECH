import React, { useState } from 'react';
import {
  Truck,
  ArrowLeftRight,
  RotateCcw,
  Wrench,
  QrCode,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Package,
  Layers,
  MapPin,
  TrendingUp,
  ExternalLink,
  Search,
  Filter,
  ShieldCheck,
  Building2,
  Calendar,
  Eye,
  Plus,
} from 'lucide-react';
import {
  StockTransferRecord,
  ReturnableDCRecord,
  TransferShortageNotification,
  UserRolePerspective,
} from '../../types/stockTransferTypes';

interface TransferDashboardProps {
  transfers?: StockTransferRecord[];
  returnableDcs?: ReturnableDCRecord[];
  shortageNotifications?: TransferShortageNotification[];
  role?: UserRolePerspective;
  currentUserRole?: UserRolePerspective;
  onNavigateTab?: (tab: string, transferId?: string) => void;
  onOpenQuickCreate?: (type: 'INTRA_PLANT' | 'INTER_PLANT' | 'RETURNABLE_DC' | 'ASSET_MOLD') => void;
  onOpenCreateModal?: () => void;
  onOpenScanModal?: () => void;
  onSelectTransferForReceipt?: (transferId: string) => void;
  onSelectTransferForTracking?: (transfer: StockTransferRecord) => void;
  showToast?: (msg: string) => void;
}

export const TransferDashboard: React.FC<TransferDashboardProps> = ({
  transfers = [],
  returnableDcs = [],
  shortageNotifications = [],
  role,
  currentUserRole,
  onNavigateTab = (_tab?: string, _transferId?: string) => {},
  onOpenQuickCreate = (_type?: any) => {},
  onOpenCreateModal = () => {},
  onOpenScanModal = () => {},
  onSelectTransferForReceipt = (_transferId?: string) => {},
  onSelectTransferForTracking = (_transfer?: StockTransferRecord) => {},
  showToast = (_msg?: string) => {},
}) => {
  const [filterPlant, setFilterPlant] = useState<string>('ALL');

  const activeRole = role || currentUserRole || 'Logistics & Dispatch Manager';
  const safeTransfers = transfers || [];
  const safeReturnableDcs = returnableDcs || [];
  const safeShortages = shortageNotifications || [];

  // KPI Calculations
  const pendingDispatchCount = safeTransfers.filter(
    (t) => t.status === 'Draft' || t.status === 'Ready for Pick' || t.status === 'Picked / Staged'
  ).length;

  const inTransitCount = safeTransfers.filter(
    (t) => t.status === 'Dispatched / In Transit' && t.transferType === 'INTER_PLANT'
  ).length;

  const pendingReceiptCount = safeTransfers.filter(
    (t) => t.status === 'Dispatched / In Transit' || t.status === 'Partially Received'
  ).length;

  const overdueReturnableCount = safeReturnableDcs.filter(
    (d) => d.agingStatus === 'Red (>30d Overdue)' && d.pendingReturnQty > 0
  ).length;

  const assetsInTransitCount = safeTransfers.filter(
    (t) => t.transferType === 'ASSET_MOLD' && (t.status === 'Dispatched / In Transit' || t.assetStatus === 'In Transit')
  ).length;

  const ewbExpiringCount = safeTransfers.filter(
    (t) => t.logistics?.eWayBillStatus === 'Expiring Soon' || (t.logistics?.eWayBillNumber && t.status === 'Dispatched / In Transit')
  ).length;

  // Active in-transit fleet
  const activeFleet = safeTransfers.filter(
    (t) => t.status === 'Dispatched / In Transit' && t.logistics?.vehicleNumber
  );

  // Inbound transfers ready for destination warehouse action
  const actionableInbounds = safeTransfers.filter(
    (t) => t.status === 'Dispatched / In Transit' || t.status === 'Partially Received'
  );

  // MTD Tax calculations
  const interPlantTransfers = safeTransfers.filter((t) => t.transferType === 'INTER_PLANT' && t.logistics);
  const totalAssessableMtd = interPlantTransfers.reduce((acc, t) => acc + (t.logistics?.assessableValue || 0), 0);
  const totalIgstMtd = interPlantTransfers.reduce((acc, t) => acc + (t.logistics?.igstAmount || 0), 0);
  const totalCgstMtd = interPlantTransfers.reduce((acc, t) => acc + (t.logistics?.cgstAmount || 0), 0);
  const totalSgstMtd = interPlantTransfers.reduce((acc, t) => acc + (t.logistics?.sgstAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
              Active Role: {role}
            </span>
            <span className="text-xs text-slate-500 font-medium">Enterprise Stock Movement v4.2</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Transfer Command Center & Movement Hub</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time unified oversight of Intra-plant, Inter-plant, Returnable Packaging, and Tooling/Asset movements.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenQuickCreate('INTRA_PLANT')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold border border-slate-300 transition-colors shadow-2xs"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-slate-600" /> + Intra-Plant
          </button>
          <button
            onClick={() => onOpenQuickCreate('INTER_PLANT')}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs"
          >
            <Truck className="w-3.5 h-3.5" /> + Inter-Plant
          </button>
          <button
            onClick={() => onOpenQuickCreate('RETURNABLE_DC')}
            className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" /> + Returnable DC
          </button>
          <button
            onClick={() => onOpenQuickCreate('ASSET_MOLD')}
            className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs"
          >
            <Wrench className="w-3.5 h-3.5" /> + Transfer Mold/Asset
          </button>
          <button
            onClick={onOpenScanModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            <QrCode className="w-4 h-4" /> Scan to Receive
          </button>
        </div>
      </div>

      {/* Screen 1: Top 6 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* 1. Pending Dispatch */}
        <div
          onClick={() => onNavigateTab('wizard')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Pending Dispatch</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
              <Clock className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{pendingDispatchCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Intra &amp; Inter Staging</div>
        </div>

        {/* 2. In Transit (Inter-Plant) */}
        <div
          onClick={() => onNavigateTab('tracking')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>In Transit</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <Truck className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-black text-blue-600 mt-2">{inTransitCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Active Inter-Plant Convoys</div>
        </div>

        {/* 3. Pending Receipt at Destination */}
        <div
          onClick={() => onNavigateTab('receipt')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-md cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Pending Inbound</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Package className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">{pendingReceiptCount}</div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">Actionable at Docks &rarr;</div>
        </div>

        {/* 4. Returnable DCs Overdue */}
        <div
          onClick={() => onNavigateTab('returnable')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-rose-400 hover:shadow-md cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>DCs Overdue (&gt;30d)</span>
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">{overdueReturnableCount}</div>
          <div className="text-[11px] text-rose-700 font-semibold mt-1">Packaging Action Req.</div>
        </div>

        {/* 5. Assets / Molds in Transit */}
        <div
          onClick={() => onNavigateTab('assets')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-purple-400 hover:shadow-md cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Molds in Transit</span>
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600 border border-purple-200">
              <Wrench className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-black text-purple-700 mt-2">{assetsInTransitCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Tool Room Regulated</div>
        </div>

        {/* 6. E-Way Bills Expiring in 24h */}
        <div
          onClick={() => onNavigateTab('taxCompliance')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-amber-400 hover:shadow-md cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>EWB Expiring &lt;24h</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
              <ShieldCheck className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">{ewbExpiringCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Statutory Transit Limit</div>
        </div>
      </div>

      {/* Critical Edge Case Alert Banner if any Shortages or Overdue DCs */}
      {shortageNotifications.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-rose-900">
                {shortageNotifications.length} Inbound Transfer Shortage / Damage Exception(s) Pending Resolution
              </div>
              <div className="text-xs text-rose-700 mt-0.5">
                Latest: {shortageNotifications[0].transferNumber} at {shortageNotifications[0].destPlant} reported short by{' '}
                {shortageNotifications[0].shortQty} units. System has blocked final closure pending write-off approval.
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('receipt')}
            className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold transition-colors whitespace-nowrap shadow-2xs"
          >
            Review Discrepancies &rarr;
          </button>
        </div>
      )}

      {/* Main 2-Column Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8-cols: Live Transit Fleet & Actionable Inbounds */}
        <div className="lg:col-span-8 space-y-6">
          {/* Widget 1: Live Transit Map & Convoy Fleet */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Live Inter-Plant Transit Fleet</h3>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[11px] font-bold">
                  {activeFleet.length} Vehicles Moving
                </span>
              </div>
              <button
                onClick={() => onNavigateTab('tracking')}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
              >
                Full Fleet Tracker <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {activeFleet.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">No vehicles currently in transit.</div>
              ) : (
                activeFleet.map((t) => (
                  <div key={t.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {t.id}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {t.logistics?.vehicleNumber || 'Unassigned'}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          ({t.logistics?.transporterName})
                        </span>
                        {t.transferType === 'ASSET_MOLD' && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-[10px] font-bold">
                            TOOLING / CRANE
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <span className="font-medium text-slate-800">{t.fromPlantName}</span>
                        <span className="text-slate-400">&rarr;</span>
                        <span className="font-medium text-slate-800">{t.toPlantName}</span>
                        <span className="text-slate-400">•</span>
                        <span>{t.logistics?.distanceKm || 0} KM</span>
                        <span className="text-slate-400">•</span>
                        <span>Driver: {t.logistics?.driverName} ({t.logistics?.driverMobile})</span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                        <span>E-Way Bill: <strong className="font-mono text-slate-700">{t.logistics?.eWayBillNumber || 'Exempt'}</strong></span>
                        {t.logistics?.eWayBillValidUntil && (
                          <span className="text-amber-700 font-medium">
                            Valid till: {t.logistics.eWayBillValidUntil}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <button
                        onClick={() => onSelectTransferForTracking(t)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" /> Track &amp; Audit
                      </button>
                      <button
                        onClick={() => onNavigateTab('receipt', t.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                      >
                        Receive at Dock
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Widget 2: Actionable Inbound Transfers for Receiving Dock */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Actionable Inbound Transfers (Receiving Dock)</h3>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-bold">
                  {actionableInbounds.length} Arriving
                </span>
              </div>
              <button
                onClick={onOpenScanModal}
                className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
              >
                <QrCode className="w-3.5 h-3.5" /> Barcode Scan GRN
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3.5 font-bold">Transfer #</th>
                    <th className="py-2.5 px-3 font-bold">Type</th>
                    <th className="py-2.5 px-3 font-bold">Source Store &rarr; Dest Store</th>
                    <th className="py-2.5 px-3 font-bold">Items / Asset</th>
                    <th className="py-2.5 px-3 font-bold">Vehicle</th>
                    <th className="py-2.5 px-3.5 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {actionableInbounds.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        No pending inbound transfers waiting for GRN.
                      </td>
                    </tr>
                  ) : (
                    actionableInbounds.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3.5 font-mono font-bold text-blue-700">
                          {t.id}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.transferType === 'INTRA_PLANT'
                                ? 'bg-slate-100 text-slate-700'
                                : t.transferType === 'INTER_PLANT'
                                ? 'bg-blue-100 text-blue-800'
                                : t.transferType === 'RETURNABLE_DC'
                                ? 'bg-teal-100 text-teal-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {t.transferType.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-700">
                          <div className="font-semibold">{t.fromStoreName}</div>
                          <div className="text-[11px] text-slate-500">&darr; {t.toStoreName}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-800">
                          {t.assetDetails ? (
                            <div>
                              <span className="font-bold text-purple-800">{t.assetDetails.assetId}</span> -{' '}
                              {t.assetDetails.moldName}
                            </div>
                          ) : (
                            <div>
                              {t.items.length} line(s):{' '}
                              <span className="font-semibold text-slate-700">
                                {t.items[0]?.itemName} {t.items.length > 1 ? `+${t.items.length - 1} more` : ''}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono font-medium text-slate-600">
                          {t.logistics?.vehicleNumber || 'Shop Trolley'}
                        </td>
                        <td className="py-3 px-3.5 text-right">
                          <button
                            onClick={() => onNavigateTab('receipt', t.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                          >
                            Receive / GRN
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 4-cols: Returnable Packaging Aging & Tax Liability MTD */}
        <div className="lg:col-span-4 space-y-6">
          {/* Widget 3: Returnable Packaging Aging Chart / Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">Returnable Packaging Aging</h3>
              </div>
              <button
                onClick={() => onNavigateTab('returnable')}
                className="text-xs text-teal-700 hover:text-teal-900 font-semibold"
              >
                Manage DCs &rarr;
              </button>
            </div>

            {/* Aging Buckets */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="text-[10px] uppercase font-bold text-emerald-700">&lt; 15 Days</div>
                <div className="text-lg font-black text-emerald-800 mt-0.5">
                  {safeReturnableDcs.filter((d) => d.agingStatus === 'Green (<15d)').length}
                </div>
                <div className="text-[10px] text-emerald-600 font-medium">Safe Cycle</div>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                <div className="text-[10px] uppercase font-bold text-amber-700">15 - 30 Days</div>
                <div className="text-lg font-black text-amber-800 mt-0.5">
                  {safeReturnableDcs.filter((d) => d.agingStatus === 'Amber (15-30d)').length}
                </div>
                <div className="text-[10px] text-amber-700 font-medium">Warning Zone</div>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                <div className="text-[10px] uppercase font-bold text-rose-700">&gt; 30 Days</div>
                <div className="text-lg font-black text-rose-800 mt-0.5">
                  {safeReturnableDcs.filter((d) => d.agingStatus === 'Red (>30d Overdue)').length}
                </div>
                <div className="text-[10px] text-rose-700 font-bold">Tax Inv Req.</div>
              </div>
            </div>

            {/* Issued vs Returned Progress Bars */}
            <div className="space-y-3 pt-1">
              <div className="text-xs font-semibold text-slate-700">Outstanding Returnable Assets:</div>
              {safeReturnableDcs.slice(0, 3).map((d) => {
                const returnedPct = Math.round((d.returnedQty / d.issuedQty) * 100) || 0;
                return (
                  <div key={d.id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{d.itemName}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          d.agingStatus.includes('Red')
                            ? 'bg-rose-100 text-rose-800'
                            : d.agingStatus.includes('Amber')
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {d.daysOutstanding}d out
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex justify-between">
                      <span>Dest: {d.destinationName}</span>
                      <span>
                        {d.returnedQty} / {d.issuedQty} {d.itemType}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          returnedPct === 100 ? 'bg-emerald-600' : 'bg-teal-600'
                        }`}
                        style={{ width: `${returnedPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Widget 4: Inter-Plant Tax Liability Summary (MTD) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Inter-Plant Tax Summary (MTD)</h3>
              </div>
              <button
                onClick={() => onNavigateTab('taxCompliance')}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
              >
                Tax Breakdown &rarr;
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">Total Assessable Value:</span>
                <span className="font-bold text-slate-900">
                  ₹{totalAssessableMtd.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-blue-50/50 border border-blue-100 text-blue-900">
                <span className="font-medium">IGST (Inter-State Cross Charge):</span>
                <span className="font-bold font-mono">₹{totalIgstMtd.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-800">
                <span className="font-medium">CGST + SGST (Intra-State Delivery Challan):</span>
                <span className="font-bold font-mono">
                  ₹{(totalCgstMtd + totalSgstMtd).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Total Delivery Challans: <strong>{interPlantTransfers.length}</strong></span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% GST / EWB Compliant
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
