import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Search,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Package,
  Truck,
  ArrowRight,
  RotateCcw,
  Wrench,
  ShieldAlert,
  ShieldCheck,
  FileCheck,
  Building2,
  Layers,
  FileText,
  Clock,
  Eye,
} from 'lucide-react';
import {
  StockTransferRecord,
  TransferShortageNotification,
  MaintenanceWorkOrderDraft,
  UserRolePerspective,
} from '../../types/stockTransferTypes';
import { usePagination } from '../../hooks/usePagination';
import { PaginationBar } from '../common/PaginationBar';

interface InboundReceiptScreenProps {
  transfers?: StockTransferRecord[];
  selectedTransferId?: string;
  currentUserRole?: UserRolePerspective;
  onPostReceipt?: (updatedTransfer: StockTransferRecord) => void;
  onCreateShortageNotification?: (notification: TransferShortageNotification) => void;
  onCreateMaintenanceWorkOrder?: (workOrder: MaintenanceWorkOrderDraft) => void;
  onNavigateTab?: (tab: string) => void;
  showToast?: (msg: string) => void;
}

export const InboundReceiptScreen: React.FC<InboundReceiptScreenProps> = ({
  transfers = [],
  selectedTransferId,
  currentUserRole = 'Logistics & Dispatch Manager',
  onPostReceipt = (_updatedTransfer?: StockTransferRecord) => {},
  onCreateShortageNotification = (_notification?: TransferShortageNotification) => {},
  onCreateMaintenanceWorkOrder = (_workOrder?: MaintenanceWorkOrderDraft) => {},
  onNavigateTab = (_tab?: string) => {},
  showToast = (_msg?: string) => {},
}) => {
  // Transfer Search / QR Code Input
  const [searchInput, setSearchInput] = useState<string>(selectedTransferId || 'XSTN-2026-00452');
  const [activeTransfer, setActiveTransfer] = useState<StockTransferRecord | null>(null);

  const { paginatedData: pagedItems, paginationProps } = usePagination(activeTransfer?.items || [], {
    initialPageSize: 10,
    pageSizeOptions: [5, 10, 20],
  });

  // Editable Received Quantities
  const [receivedQtys, setReceivedQtys] = useState<Record<string, number>>({});
  const [acceptedQtys, setAcceptedQtys] = useState<Record<string, number>>({});
  const [rejectedQtys, setRejectedQtys] = useState<Record<string, number>>({});
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});

  // Asset/Mold Receipt fields (Screen 5 & 7 Rules)
  const [assetLocation, setAssetLocation] = useState<string>('Tool Room Bay 03');
  const [assetCondition, setAssetCondition] = useState<'OK' | 'Needs Service' | 'Damaged in Transit'>('OK');
  const [damageNotes, setDamageNotes] = useState<string>('');
  const [prodManagerSigned, setProdManagerSigned] = useState<boolean>(true);

  // Modals
  const [showScanMismatchModal, setShowScanMismatchModal] = useState<boolean>(false);
  const [mismatchedScanCode, setMismatchedScanCode] = useState<string>('');
  const [showGrnPrintModal, setShowGrnPrintModal] = useState<boolean>(false);
  const [showShortageModal, setShowShortageModal] = useState<boolean>(false);

  // Sync active transfer on mount or search
  useEffect(() => {
    const idToFind = selectedTransferId || searchInput;
    const match = transfers.find((t) => t.id.toLowerCase() === idToFind.trim().toLowerCase());
    if (match) {
      setActiveTransfer(match);
      // Initialize qtys
      const initReceived: Record<string, number> = {};
      const initAccepted: Record<string, number> = {};
      const initRejected: Record<string, number> = {};
      const initReasons: Record<string, string> = {};

      match.items.forEach((item) => {
        const qty = item.receivedQty ?? item.transferQty;
        initReceived[item.id] = qty;
        initAccepted[item.id] = item.acceptedQty ?? qty;
        initRejected[item.id] = item.rejectedQty ?? 0;
        initReasons[item.id] = item.rejectionReason || 'None';
      });

      setReceivedQtys(initReceived);
      setAcceptedQtys(initAccepted);
      setRejectedQtys(initRejected);
      setRejectionReasons(initReasons);
    }
  }, [selectedTransferId, searchInput, transfers]);

  const handleSearchTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const match = transfers.find((t) => t.id.toLowerCase() === searchInput.trim().toLowerCase());
    if (match) {
      setActiveTransfer(match);
      showToast(`Loaded transfer note ${match.id}`);
    } else {
      setMismatchedScanCode(searchInput);
      setShowScanMismatchModal(true);
    }
  };

  // Bulk Accept All (Screen 5 Action)
  const handleAcceptAll = () => {
    if (!activeTransfer) return;
    const newReceived: Record<string, number> = {};
    const newAccepted: Record<string, number> = {};
    const newRejected: Record<string, number> = {};

    activeTransfer.items.forEach((item) => {
      newReceived[item.id] = item.transferQty;
      newAccepted[item.id] = item.transferQty;
      newRejected[item.id] = 0;
    });

    setReceivedQtys(newReceived);
    setAcceptedQtys(newAccepted);
    setRejectedQtys(newRejected);
    showToast('Accepted 100% of dispatched quantity across all line items.');
  };

  // Update received qty for a line
  const handleReceivedQtyChange = (itemId: string, val: number, dispatchedQty: number) => {
    const rec = Math.max(0, val);
    setReceivedQtys((prev) => ({ ...prev, [itemId]: rec }));

    const short = Math.max(0, dispatchedQty - rec);
    setRejectedQtys((prev) => ({ ...prev, [itemId]: short }));
    setAcceptedQtys((prev) => ({ ...prev, [itemId]: rec }));
  };

  // Post Receipt Action (Edge Case 1 & Edge Case 3 Handlers)
  const handlePostReceipt = () => {
    if (!activeTransfer) return;

    // Check for Shortage
    let totalShort = 0;
    let shortItem: any = null;

    activeTransfer.items.forEach((i) => {
      const rec = receivedQtys[i.id] ?? i.transferQty;
      if (rec < i.transferQty) {
        totalShort += i.transferQty - rec;
        shortItem = i;
      }
    });

    // Check for Damaged Asset (Edge Case 3)
    if (activeTransfer.transferType === 'ASSET_MOLD' && assetCondition === 'Damaged in Transit') {
      const mwoId = `MWO-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const claimNo = `INS-CLM-2026-${Math.floor(10000 + Math.random() * 90000)}`;

      onCreateMaintenanceWorkOrder({
        id: mwoId,
        assetId: activeTransfer.assetDetails?.assetId || 'MOLD-001',
        moldName: activeTransfer.assetDetails?.moldName || 'Injection Mold',
        reportedDate: '2026-09-12',
        reportedAtPlant: activeTransfer.toPlantName,
        severity: 'Critical (Line Down)',
        damageDetails: damageNotes || 'Asset damaged during inter-plant transit. Crushed guide pins.',
        insuranceClaimDraftNo: claimNo,
        status: 'Draft Work Order Staged',
      });

      const updated: StockTransferRecord = {
        ...activeTransfer,
        status: 'Partially Received',
        assetStatus: 'Under Maintenance',
        grnNumber: `GRN-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        grnDate: '2026-09-12',
        grnReceivedBy: currentUserRole,
        remarks: `DAMAGED IN TRANSIT: Blocked from production. Generated ${mwoId} & Claim ${claimNo}.`,
        auditTrail: [
          ...activeTransfer.auditTrail,
          {
            id: `AUD-${Date.now()}`,
            timestamp: '2026-09-12 10:45:00',
            userName: 'Receiving Officer',
            userRole: currentUserRole,
            action: 'Received',
            location: activeTransfer.toStoreName,
            deviceIp: '192.168.2.88',
            changesMade: `Reported asset damage. Staged Maintenance Work Order ${mwoId}.`,
          },
        ],
      };

      onPostReceipt(updated);
      showToast('Asset marked DAMAGED. Work order & insurance claim draft created.');
      return;
    }

    // Edge Case 1: Shortage at Receipt
    if (totalShort > 0) {
      const notifId = `TSN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      onCreateShortageNotification({
        id: notifId,
        transferNumber: activeTransfer.id,
        dateReported: '2026-09-12',
        itemCode: shortItem?.itemCode || 'ITEM-01',
        itemName: shortItem?.itemName || 'Material',
        dispatchedQty: shortItem?.transferQty || 0,
        receivedQty: receivedQtys[shortItem?.id] || 0,
        shortQty: totalShort,
        sourcePlant: activeTransfer.fromPlantName,
        destPlant: activeTransfer.toPlantName,
        reason: rejectionReasons[shortItem?.id] || 'Physical Shortage / Transit Spillage',
        status: 'Pending Decision',
        decisionNotes: 'Awaiting decision: Approve insurance write-off or dispatch replacement from source.',
      });

      const updated: StockTransferRecord = {
        ...activeTransfer,
        status: 'Partially Received', // Blocks closing
        shortageReported: true,
        shortageDetails: {
          shortQtyTotal: totalShort,
          reason: rejectionReasons[shortItem?.id] || 'Transit Shortage',
          notificationSentTo: ['Source Plant Head', 'Finance / Accounts Dept', 'Logistics Team'],
          decisionStatus: 'Pending Decision',
        },
        grnNumber: `GRN-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        grnDate: '2026-09-12',
        grnReceivedBy: currentUserRole,
        auditTrail: [
          ...activeTransfer.auditTrail,
          {
            id: `AUD-${Date.now()}`,
            timestamp: '2026-09-12 10:50:00',
            userName: 'Receiving Officer',
            userRole: currentUserRole,
            action: 'Shortage Reported',
            location: activeTransfer.toStoreName,
            deviceIp: '192.168.2.88',
            changesMade: `Received short by ${totalShort} units. Created ${notifId}. Blocked transfer from closure.`,
          },
        ],
      };

      onPostReceipt(updated);
      showToast(`GRN Posted with Shortage. Notification ${notifId} routed to Finance.`);
      return;
    }

    // Standard Clean GRN Receipt
    const updated: StockTransferRecord = {
      ...activeTransfer,
      status: 'Received / Completed',
      assetStatus: activeTransfer.transferType === 'ASSET_MOLD' ? 'Received at Plant' : undefined,
      grnNumber: `GRN-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      grnDate: '2026-09-12',
      grnReceivedBy: currentUserRole,
      auditTrail: [
        ...activeTransfer.auditTrail,
        {
          id: `AUD-${Date.now()}`,
          timestamp: '2026-09-12 10:55:00',
          userName: 'Receiving Officer',
          userRole: currentUserRole,
          action: 'Received',
          location: activeTransfer.toStoreName,
          deviceIp: '192.168.2.88',
          changesMade: 'Goods Receipt Note posted into destination store. Stock balance updated.',
        },
      ],
    };

    onPostReceipt(updated);
    showToast(`GRN ${updated.grnNumber} posted! Stock moved to ${activeTransfer.toStoreName}`);
    setShowGrnPrintModal(true);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Bar with Big QR Scan & Search Input */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Destination Plant Inbound Portal
            </span>
            <span className="text-xs text-slate-500 font-medium">Screen 5: Transfer GRN Terminal</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">Inbound Receipt &amp; Quality Inspection</h2>
        </div>

        {/* Big QR / Barcode Scan Input */}
        <form onSubmit={handleSearchTransfer} className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <QrCode className="w-5 h-5 text-emerald-600 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Scan Barcode / Enter STN Number..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
              className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors whitespace-nowrap shadow-sm flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" /> Fetch Transfer
          </button>
        </form>
      </div>

      {!activeTransfer ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Scan or Enter a Transfer Note</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Scan the QR code printed on the physical Delivery Challan or vehicle Gate Pass to pull up the manifest.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Card (Huge Bold Transfer Number as specified in Section 5) */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-2xl md:text-3xl font-black text-white tracking-wider">
                  {activeTransfer.id}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    activeTransfer.status === 'Received / Completed'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : activeTransfer.status === 'Partially Received'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  }`}
                >
                  Status: {activeTransfer.status === 'Dispatched / In Transit' ? 'Receiving at Dock' : activeTransfer.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-xs text-slate-300 mt-3">
                <div>
                  <span className="text-slate-400">Source:</span>{' '}
                  <strong className="text-white">{activeTransfer.fromPlantName}</strong> ({activeTransfer.fromStoreName})
                </div>
                <div>
                  <span className="text-slate-400">Destination:</span>{' '}
                  <strong className="text-white">{activeTransfer.toPlantName}</strong> ({activeTransfer.toStoreName})
                </div>
                <div>
                  <span className="text-slate-400">Vehicle Assigned:</span>{' '}
                  <strong className="font-mono text-emerald-400">
                    {activeTransfer.logistics?.vehicleNumber || 'Internal Shop Trolley'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400">Gate Pass #:</span>{' '}
                  <strong className="font-mono text-white">{activeTransfer.gatePassNumber}</strong>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
              <button
                onClick={handleAcceptAll}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-colors"
              >
                Accept All Qty
              </button>
              <button
                onClick={handlePostReceipt}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition-colors shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Post Receipt (GRN)
              </button>
            </div>
          </div>

          {/* ASSET / MOLD INBOUND SPECIFIC PANEL (Screen 5 & 7 UX Rules) */}
          {activeTransfer.transferType === 'ASSET_MOLD' && activeTransfer.assetDetails && (
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
                  <Wrench className="w-5 h-5 text-purple-700" />
                  Asset Handover &amp; Tooling Condition Inspection
                </div>
                <span className="text-xs font-mono font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                  {activeTransfer.assetDetails.assetId}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-500">Mold / Asset Name:</span>
                  <div className="font-bold text-slate-900">{activeTransfer.assetDetails.moldName}</div>
                </div>
                <div>
                  <span className="text-slate-500">Serial Tag:</span>
                  <div className="font-mono font-bold text-slate-900">{activeTransfer.assetDetails.serialNumber}</div>
                </div>
                <div>
                  <span className="text-slate-500">Recorded Lifetime Shots:</span>
                  <div className="font-bold text-slate-900">
                    {activeTransfer.assetDetails.currentShotCount.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Insurance Declared:</span>
                  <div className="font-bold text-slate-900">
                    ₹{activeTransfer.assetDetails.insuranceDeclaredValue.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-purple-200">
                <div>
                  <label className="block text-xs font-medium text-purple-900 mb-1">
                    Destination Rack / Floor Location <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={assetLocation}
                    onChange={(e) => setAssetLocation(e.target.value)}
                    className="w-full bg-white border border-purple-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-purple-900 mb-1">
                    Physical Receiving Condition <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={assetCondition}
                    onChange={(e) => setAssetCondition(e.target.value as any)}
                    className="w-full bg-white border border-purple-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900"
                  >
                    <option value="OK">OK - Sound Condition (Clear for Production)</option>
                    <option value="Needs Service">Needs Service - Preventative Greasing / Cleaning</option>
                    <option value="Damaged in Transit">
                      Damaged in Transit (Blocks Production &amp; Triggers MWO + Insurance Claim)
                    </option>
                  </select>
                </div>
              </div>

              {assetCondition === 'Damaged in Transit' && (
                <div className="p-3 bg-rose-100 border border-rose-300 rounded-xl space-y-2 text-xs text-rose-900">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-700" />
                    Critical In-Transit Damage Protocol Triggered
                  </div>
                  <div>
                    System will automatically block this mold from being mounted on any injection press, and generate an
                    immediate Maintenance Work Order (MWO) draft and an Insurance Claim submission.
                  </div>
                  <input
                    type="text"
                    value={damageNotes}
                    onChange={(e) => setDamageNotes(e.target.value)}
                    placeholder="Describe visible damage (e.g. sheared guide pins, hydraulic core leak)..."
                    className="w-full bg-white border border-rose-300 rounded-lg p-2 text-xs text-slate-900"
                  />
                </div>
              )}
            </div>
          )}

          {/* STANDARD MATERIAL RECEIPT LINES TABLE */}
          {activeTransfer.items.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Receipt Verification Lines ({activeTransfer.items.length})
                  </h3>
                </div>
                <div className="text-xs text-slate-500">
                  Editable fields are highlighted in green. Enter physical count at destination dock.
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3.5 font-bold">Item Code &amp; Description</th>
                      <th className="py-2.5 px-3 font-bold">Batch / Lot #</th>
                      <th className="py-2.5 px-3 font-bold text-right">Dispatched Qty</th>
                      <th className="py-2.5 px-3 font-bold text-right w-28 bg-emerald-50 text-emerald-800">
                        Received Qty *
                      </th>
                      <th className="py-2.5 px-3 font-bold text-right">Accepted Qty</th>
                      <th className="py-2.5 px-3 font-bold text-right">Short / Damage</th>
                      <th className="py-2.5 px-3 font-bold">Reason Code</th>
                      <th className="py-2.5 px-3.5 font-bold text-center">Variance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pagedItems.map((item) => {
                      const rec = receivedQtys[item.id] ?? item.transferQty;
                      const short = Math.max(0, item.transferQty - rec);
                      const hasVariance = short > 0;

                      return (
                        <tr key={item.id} className={hasVariance ? 'bg-rose-50/50' : 'hover:bg-slate-50'}>
                          <td className="py-3 px-3.5">
                            <div className="font-mono font-bold text-blue-700">{item.itemCode}</div>
                            <div className="text-[11px] text-slate-600">{item.itemName}</div>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-700">{item.batchLotNumber}</td>
                          <td className="py-3 px-3 text-right font-semibold text-slate-800">
                            {item.transferQty.toLocaleString()} {item.uom}
                          </td>
                          <td className="py-3 px-3 text-right bg-emerald-50/30">
                            <input
                              type="number"
                              min={0}
                              value={rec}
                              onChange={(e) =>
                                handleReceivedQtyChange(
                                  item.id,
                                  parseFloat(e.target.value) || 0,
                                  item.transferQty
                                )
                              }
                              className="w-24 text-right bg-white border border-emerald-400 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                            />
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                            {rec} {item.uom}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-rose-600">
                            {short > 0 ? `-${short}` : '0'}
                          </td>
                          <td className="py-3 px-3">
                            <select
                              value={rejectionReasons[item.id] || 'None'}
                              onChange={(e) =>
                                setRejectionReasons((prev) => ({ ...prev, [item.id]: e.target.value }))
                              }
                              disabled={short === 0}
                              className="bg-white border border-slate-300 rounded px-2 py-1 text-[11px] disabled:bg-slate-100 disabled:text-slate-400"
                            >
                              <option value="None">None (Full Count)</option>
                              <option value="Physical Shortage">Physical Shortage (Torn/Missing Bags)</option>
                              <option value="Carton Damage / Wet">Carton Damage / Wetness</option>
                              <option value="Spillage in Transit">Spillage in Transit</option>
                              <option value="Batch Mismatch">Batch Label Mismatch</option>
                            </select>
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            {hasVariance ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                Short {short} {item.uom}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                100% Match
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <PaginationBar {...paginationProps} itemName="items" />
            </div>
          )}

          {/* Action Confirmation Bar */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>
                Posting GRN will credit stock directly to{' '}
                <strong className="text-slate-900">{activeTransfer.toStoreName}</strong>.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowGrnPrintModal(true)}
                className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" /> GRN Preview
              </button>
              <button
                type="button"
                onClick={handlePostReceipt}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-colors shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Confirm &amp; Post Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Red Error Modal for Scanned Item/Batch Mismatch (Screen 5 UX Rule) */}
      {showScanMismatchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border-2 border-rose-500 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-black text-rose-700">Scan Verification Mismatch!</h3>
              <p className="text-xs text-slate-600 mt-1">
                Scanned barcode / Transfer Note <strong className="font-mono text-slate-900">"{mismatchedScanCode}"</strong>{' '}
                does not match any active transfer record destined for this receiving dock.
              </p>
            </div>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 space-y-1">
              <div>• Verify if shipment was mistakenly routed to the wrong plant dock.</div>
              <div>• Check if transfer note was already received and closed earlier.</div>
            </div>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setShowScanMismatchModal(false)}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Acknowledge &amp; Rescan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GRN Print Preview Modal */}
      {showGrnPrintModal && activeTransfer && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-emerald-700">
                  {activeTransfer.grnNumber || 'GRN-2026-PENDING'}
                </span>
                <h3 className="text-base font-bold text-slate-900">Goods Receipt Note (GRN)</h3>
              </div>
              <button
                onClick={() => setShowGrnPrintModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 border border-slate-300 rounded-xl space-y-3 text-xs font-sans">
              <div className="flex justify-between items-start border-b border-slate-200 pb-2">
                <div>
                  <div className="font-bold text-slate-900">{activeTransfer.toPlantName}</div>
                  <div className="text-slate-600 text-[11px]">Receiving Store: {activeTransfer.toStoreName}</div>
                </div>
                <div className="text-right font-mono">
                  <div className="font-bold text-slate-900">Ref Transfer: {activeTransfer.id}</div>
                  <div className="text-slate-500 text-[11px]">Date: 2026-09-12 11:00 AM</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] p-2 bg-slate-50 rounded">
                <div>Vehicle: <strong>{activeTransfer.logistics?.vehicleNumber || 'Internal Trolley'}</strong></div>
                <div>Driver: <strong>{activeTransfer.logistics?.driverName || 'N/A'}</strong></div>
              </div>

              <table className="w-full text-left border border-slate-200">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-1.5 border border-slate-200">Item</th>
                    <th className="p-1.5 border border-slate-200 text-right">Dispatched</th>
                    <th className="p-1.5 border border-slate-200 text-right">Received</th>
                    <th className="p-1.5 border border-slate-200">Condition</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTransfer.items.map((i) => (
                    <tr key={i.id}>
                      <td className="p-1.5 border border-slate-200 font-medium">{i.itemName}</td>
                      <td className="p-1.5 border border-slate-200 text-right">{i.transferQty} {i.uom}</td>
                      <td className="p-1.5 border border-slate-200 text-right font-bold text-emerald-700">
                        {receivedQtys[i.id] ?? i.transferQty} {i.uom}
                      </td>
                      <td className="p-1.5 border border-slate-200">{rejectionReasons[i.id] || 'Sound'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-200 text-center text-[10px]">
                <div>
                  <div className="border-b border-slate-400 h-8 mb-1" />
                  <span>Inspected By: Quality Assurance</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 h-8 mb-1" />
                  <span>Posted By: Destination Store Keeper</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowGrnPrintModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  showToast('Sent official GRN to dock printer.');
                  setShowGrnPrintModal(false);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Print Official GRN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
