import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Plus,
  QrCode,
  RotateCcw,
  Wrench,
  ShieldCheck,
  Truck,
  FileText,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Search,
  Building2,
  Calendar,
  Eye,
  Sliders,
  X,
} from 'lucide-react';
import {
  StockTransferRecord,
  ReturnableDCRecord,
  AssetMoldItem,
  TransferShortageNotification,
  MaintenanceWorkOrderDraft,
  UserRolePerspective,
} from '../../types/stockTransferTypes';
import {
  INITIAL_STOCK_TRANSFERS,
  INITIAL_RETURNABLE_DCS,
  MASTER_MOLDS_CATALOG,
} from '../../data/stockTransferData';
import { TransferDashboard } from './TransferDashboard';
import { CreateTransferWizard } from './CreateTransferWizard';
import { InboundReceiptScreen } from './InboundReceiptScreen';
import { ReturnableDCScreen } from './ReturnableDCScreen';
import { AssetMoldTransferScreen } from './AssetMoldTransferScreen';
import { InterPlantTaxComplianceScreen } from './InterPlantTaxComplianceScreen';
import { TransferTrackingAuditDrawer } from './TransferTrackingAuditDrawer';

interface StockTransferManagerProps {
  onBackToWarehouse?: () => void;
}

export const StockTransferManager: React.FC<StockTransferManagerProps> = ({
  onBackToWarehouse,
}) => {
  // Global State
  const [transfers, setTransfers] = useState<StockTransferRecord[]>(INITIAL_STOCK_TRANSFERS);
  const [returnableDcs, setReturnableDcs] = useState<ReturnableDCRecord[]>(INITIAL_RETURNABLE_DCS);
  const [shortageNotifications, setShortageNotifications] = useState<TransferShortageNotification[]>([
    {
      id: 'TSN-2026-0044',
      transferNumber: 'STN-2026-00122',
      dateReported: '2026-09-10',
      itemCode: 'RAW-PP-INJ-001',
      itemName: 'Polypropylene Copolymer (PPCP) Repol H030SG',
      dispatchedQty: 500,
      receivedQty: 480,
      shortQty: 20,
      sourcePlant: 'Unit 1 - Pimpri Auto-Plastics',
      destPlant: 'Unit 2 - Chakan Assembly Plant',
      reason: 'Physical Shortage / Transit Spillage',
      status: 'Pending Decision',
      decisionNotes: 'Awaiting source plant dispatch authorization for 20 KG balance or insurance write-off.',
    },
  ]);
  const [maintenanceWorkOrders, setMaintenanceWorkOrders] = useState<MaintenanceWorkOrderDraft[]>([]);

  // Navigation & View States
  const [currentTab, setCurrentTab] = useState<
    'DASHBOARD' | 'CREATE' | 'RECEIPT' | 'RETURNABLE' | 'ASSETS' | 'TAX_COMPLIANCE'
  >('DASHBOARD');
  const [selectedTransferForReceipt, setSelectedTransferForReceipt] = useState<string>('');
  const [activeTrackingTransfer, setActiveTrackingTransfer] = useState<StockTransferRecord | null>(null);

  // User Role Switcher for ERP testing
  const [currentUserRole, setCurrentRole] = useState<UserRolePerspective>('Logistics & Dispatch Manager');

  // Wizard Preselection (e.g. from Asset screen or Returnable screen)
  const [wizardPreselectedType, setWizardPreselectedType] = useState<any>(undefined);
  const [wizardPreselectedAsset, setWizardPreselectedAsset] = useState<AssetMoldItem | undefined>(undefined);

  // Toast System
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // HANDLERS
  const handleSaveTransfer = (newTransfer: StockTransferRecord) => {
    setTransfers((prev) => [newTransfer, ...prev]);
    showToast(`Transfer Note ${newTransfer.id} generated and scheduled for dispatch.`);
    setCurrentTab('DASHBOARD');
  };

  const handlePostReceipt = (updatedTransfer: StockTransferRecord) => {
    setTransfers((prev) =>
      prev.map((t) => (t.id === updatedTransfer.id ? updatedTransfer : t))
    );
  };

  const handleCreateShortageNotification = (notif: TransferShortageNotification) => {
    setShortageNotifications((prev) => [notif, ...prev]);
  };

  const handleCreateMaintenanceWorkOrder = (mwo: MaintenanceWorkOrderDraft) => {
    setMaintenanceWorkOrders((prev) => [mwo, ...prev]);
  };

  const handleReceiveReturn = (dcId: string, returnedQty: number, condition: string) => {
    setReturnableDcs((prev) =>
      prev.map((dc) => {
        if (dc.id === dcId) {
          const newReturned = dc.returnedQty + returnedQty;
          const newPending = Math.max(0, dc.issuedQty - newReturned);
          return {
            ...dc,
            returnedQty: newReturned,
            pendingReturnQty: newPending,
            agingStatus: newPending === 0 ? 'Closed (<15d)' : dc.agingStatus,
          };
        }
        return dc;
      })
    );
    showToast(`Received ${returnedQty} units for ${dcId}. Added to Returnable Packaging Store.`);
  };

  const handleConvertToInvoice = (dcId: string, invoiceNumber: string) => {
    setReturnableDcs((prev) =>
      prev.map((dc) => {
        if (dc.id === dcId) {
          return {
            ...dc,
            convertedToTaxInvoice: true,
            taxInvoiceNumber: invoiceNumber,
            pendingReturnQty: 0,
          };
        }
        return dc;
      })
    );
    showToast(`Generated Tax Invoice ${invoiceNumber} for unreturned DC ${dcId}.`);
  };

  const handleUpdateVehicleAndExtendEwb = (
    transferId: string,
    newVehicle: string,
    reason: string
  ) => {
    setTransfers((prev) =>
      prev.map((t) => {
        if (t.id === transferId) {
          const updatedTrail = [
            ...t.auditTrail,
            {
              id: `AUD-${Date.now()}`,
              timestamp: '2026-09-12 11:15:00',
              userName: 'Logistics Officer',
              userRole: currentUserRole,
              action: 'Vehicle Breakdown / E-Way Bill Extension',
              location: 'Highway NH-48 Transshipment Bay',
              deviceIp: '192.168.1.55',
              changesMade: `Replaced vehicle with ${newVehicle}. Reason: ${reason}. Extended EWB validity by 24h.`,
            },
          ];

          return {
            ...t,
            logistics: t.logistics
              ? {
                  ...t.logistics,
                  vehicleNumber: newVehicle,
                  eWayBillValidUntil: '2026-09-15 23:59:00 (Extended)',
                }
              : undefined,
            auditTrail: updatedTrail,
          };
        }
        return t;
      })
    );

    if (activeTrackingTransfer && activeTrackingTransfer.id === transferId) {
      setActiveTrackingTransfer((prev) =>
        prev
          ? {
              ...prev,
              logistics: prev.logistics
                ? {
                    ...prev.logistics,
                    vehicleNumber: newVehicle,
                    eWayBillValidUntil: '2026-09-15 23:59:00 (Extended)',
                  }
                : undefined,
            }
          : null
      );
    }

    showToast(`Vehicle updated to ${newVehicle}. E-Way Bill extension synchronized with GST portal.`);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 pb-12 font-sans antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-800 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header & Perspective Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full md:w-auto">
            {onBackToWarehouse && (
              <button
                onClick={onBackToWarehouse}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                &larr; Warehouse Hub
              </button>
            )}
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  Stock Transfer &amp; Movement System
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  GST &amp; E-Way Compliant
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Multi-Plant Logistics, Returnable DC Lifecycle &amp; Tooling Handover
              </p>
            </div>
          </div>

          {/* User Role Perspective Switcher */}
          <div className="flex items-center gap-2 text-xs w-full md:w-auto justify-end">
            <span className="text-slate-500 font-medium whitespace-nowrap">Role Perspective:</span>
            <select
              value={currentUserRole}
              onChange={(e) => {
                setCurrentRole(e.target.value as any);
                showToast(`Switched perspective to ${e.target.value}`);
              }}
              className="bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="Plant A Dispatcher">Plant A Dispatcher (Source)</option>
              <option value="Plant B Receiver">Plant B Receiver (Destination Dock)</option>
              <option value="Logistics & Dispatch Manager">Logistics &amp; Dispatch Manager</option>
              <option value="Tool Room Engineer">Tool Room Engineer (Asset/Mold)</option>
              <option value="Finance & Tax Auditor">Finance &amp; Tax Auditor</option>
            </select>
          </div>
        </div>

        {/* Global Navigation Tabs (All 8 Modules from Spec) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto border-t border-slate-100">
          {[
            { id: 'DASHBOARD', label: 'Transfer Dashboard', icon: Layers },
            { id: 'CREATE', label: 'Create Transfer (Wizard)', icon: Plus },
            { id: 'RECEIPT', label: 'Inbound Receipt & GRN', icon: QrCode },
            { id: 'RETURNABLE', label: 'Returnable Packaging DCs', icon: RotateCcw },
            { id: 'ASSETS', label: 'Asset & Mold Registry', icon: Wrench },
            { id: 'TAX_COMPLIANCE', label: 'Inter-Plant Tax & E-Way', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'CREATE') {
                    setWizardPreselectedType(undefined);
                    setWizardPreselectedAsset(undefined);
                  }
                  setCurrentTab(tab.id as any);
                }}
                className={`py-3 px-3.5 text-xs font-bold border-b-2 whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                  isActive
                    ? 'border-blue-600 text-blue-600 bg-blue-50/40'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* Shortage Notification Banner (Edge Case 1 Notification) */}
        {shortageNotifications.length > 0 && (
          <div className="mb-6 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <strong>Active Shortage Alert:</strong> Transfer{' '}
                <span className="font-mono font-bold">{shortageNotifications[0].transferNumber}</span> has a shortage
                of <span className="font-bold">{shortageNotifications[0].shortQty} units</span>. Automatic notification
                routed to Finance. Transfer is blocked from closing until decision.
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedTransferForReceipt(shortageNotifications[0].transferNumber);
                setCurrentTab('RECEIPT');
              }}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-colors shrink-0 shadow-2xs"
            >
              Inspect Shortage Record
            </button>
          </div>
        )}

        {/* Maintenance Work Order Alert (Edge Case 3 Mold Damaged) */}
        {maintenanceWorkOrders.length > 0 && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-rose-900">
              <Wrench className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <strong>Critical Tooling Damage:</strong> Work Order{' '}
                <span className="font-mono font-bold">{maintenanceWorkOrders[0].id}</span> generated for mold{' '}
                <strong>{maintenanceWorkOrders[0].assetId}</strong>. Asset is blocked from production mounting. Insurance
                draft: <span className="font-mono">{maintenanceWorkOrders[0].insuranceClaimDraftNo}</span>.
              </div>
            </div>
            <button
              onClick={() => setCurrentTab('ASSETS')}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition-colors shrink-0 shadow-2xs"
            >
              View Asset Passport
            </button>
          </div>
        )}

        {/* View Routing */}
        {currentTab === 'DASHBOARD' && (
          <TransferDashboard
            transfers={transfers}
            returnableDcs={returnableDcs}
            shortageNotifications={shortageNotifications}
            role={currentUserRole}
            currentUserRole={currentUserRole}
            onNavigateTab={(tab, transferId) => {
              if (tab === 'RECEIPT' || tab === 'receipt') {
                if (transferId) setSelectedTransferForReceipt(transferId);
                setCurrentTab('RECEIPT');
              } else if (tab === 'RETURNABLE' || tab === 'returnable') {
                setCurrentTab('RETURNABLE');
              } else if (tab === 'ASSETS' || tab === 'assets') {
                setCurrentTab('ASSETS');
              } else if (tab === 'TAX_COMPLIANCE' || tab === 'tax') {
                setCurrentTab('TAX_COMPLIANCE');
              } else if (tab === 'CREATE' || tab === 'create') {
                setCurrentTab('CREATE');
              } else {
                setCurrentTab('DASHBOARD');
              }
            }}
            onOpenCreateModal={() => {
              setWizardPreselectedType(undefined);
              setWizardPreselectedAsset(undefined);
              setCurrentTab('CREATE');
            }}
            onOpenQuickCreate={(type) => {
              setWizardPreselectedType(type);
              setWizardPreselectedAsset(undefined);
              setCurrentTab('CREATE');
            }}
            onOpenScanModal={() => {
              setCurrentTab('RECEIPT');
            }}
            onSelectTransferForReceipt={(transferId) => {
              setSelectedTransferForReceipt(transferId);
              setCurrentTab('RECEIPT');
            }}
            onSelectTransferForTracking={(transfer) => {
              setActiveTrackingTransfer(transfer);
            }}
            showToast={showToast}
          />
        )}

        {currentTab === 'CREATE' && (
          <CreateTransferWizard
            currentUserRole={currentUserRole}
            initialType={wizardPreselectedType}
            preselectedType={wizardPreselectedType}
            preselectedAsset={wizardPreselectedAsset}
            onSaveTransfer={handleSaveTransfer}
            onCancel={() => setCurrentTab('DASHBOARD')}
            showToast={showToast}
          />
        )}

        {currentTab === 'RECEIPT' && (
          <InboundReceiptScreen
            transfers={transfers}
            selectedTransferId={selectedTransferForReceipt}
            currentUserRole={currentUserRole}
            onPostReceipt={handlePostReceipt}
            onCreateShortageNotification={handleCreateShortageNotification}
            onCreateMaintenanceWorkOrder={handleCreateMaintenanceWorkOrder}
            onNavigateTab={(tab: string) => setCurrentTab(tab as any)}
            showToast={showToast}
          />
        )}

        {currentTab === 'RETURNABLE' && (
          <ReturnableDCScreen
            returnableDcs={returnableDcs}
            currentUserRole={currentUserRole}
            onReceiveReturn={handleReceiveReturn}
            onConvertToInvoice={handleConvertToInvoice}
            onOpenCreateModal={() => {
              setWizardPreselectedType('RETURNABLE_DC');
              setCurrentTab('CREATE');
            }}
            showToast={showToast}
          />
        )}

        {currentTab === 'ASSETS' && (
          <AssetMoldTransferScreen
            transfers={transfers}
            currentUserRole={currentUserRole}
            onInitiateAssetTransfer={(asset) => {
              setWizardPreselectedType('ASSET_MOLD');
              setWizardPreselectedAsset(asset);
              setCurrentTab('CREATE');
            }}
            onSelectTransferForTracking={(transfer) => {
              setActiveTrackingTransfer(transfer);
            }}
            showToast={showToast}
          />
        )}

        {currentTab === 'TAX_COMPLIANCE' && (
          <InterPlantTaxComplianceScreen
            transfers={transfers}
            currentUserRole={currentUserRole}
            onSelectTransferForTracking={(transfer) => {
              setActiveTrackingTransfer(transfer);
            }}
            showToast={showToast}
          />
        )}
      </main>

      {/* Screen 8: Transfer Tracking & Audit Drawer (Who, When, Where Matrix + Timeline) */}
      {activeTrackingTransfer && (
        <TransferTrackingAuditDrawer
          transfer={activeTrackingTransfer}
          currentUserRole={currentUserRole}
          onClose={() => setActiveTrackingTransfer(null)}
          onUpdateVehicleAndExtendEwb={handleUpdateVehicleAndExtendEwb}
          showToast={showToast}
        />
      )}
    </div>
  );
};
