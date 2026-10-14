import React, { useState } from 'react';
import {
  Code,
  Layers,
  Zap,
  FolderTree,
  FileCode,
  ShieldCheck,
  Cpu,
  Copy,
  Check,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Boxes,
  Database,
  Workflow,
  Sparkles,
  Lock,
  Shield,
  Key,
  AlertTriangle,
  CheckCircle2,
  Terminal,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { PromptBuilder } from '../shared/components/PromptBuilder';
import { StreamingText } from '../shared/components/StreamingText';
import { RequireAuth, useAuthContext } from '../shared/components/RequireAuth';
import { SanitizedHtml, sanitizeHtml } from '../shared/components/SanitizedHtml';

export const ReactArchitectureGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'featureModules' | 'lazyRoutes' | 'servicesState' | 'performance' | 'aiStack' | 'security'>('architecture');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Interactive Security Directives State
  const [testRawHtml, setTestRawHtml] = useState<string>(
    '<div class="p-3 bg-red-50 text-red-900 rounded-lg border border-red-200"><b>Alert:</b> Cavity temp spike on Line 02!<img src=x onerror="console.warn(\'Blocked script execution via DOMPurify\')" /><script>alert("Malicious script blocked!")</script><a href="javascript:stealTokens()" class="underline font-bold text-red-700 ml-2">Click payload link</a></div>'
  );
  const [simulatedRole, setSimulatedRole] = useState<'admin' | 'user' | 'quality' | 'unauthenticated'>('user');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const projectTree = `reboot-react-erp/
├── src/
│   ├── core/                            # Singleton infrastructure, app shell & navigation
│   │   ├── Topbar.tsx                   # Universal search, plant/shift switcher, breadcrumbs
│   │   ├── Sidebar.tsx                  # Collapsible multi-module menu with pinned favorites
│   │   ├── Drawer.tsx                   # Slide-over panel container
│   │   ├── ConfirmModal.tsx             # Destructive action / reversal confirmation modal
│   │   └── index.ts                     # Core barrel export
│   ├── shared/                          # Cross-cutting UI primitives, tables & base models
│   │   ├── AdvancedDataTable.tsx        # Column sort, filter, export, pagination
│   │   ├── PaginationBar.tsx            # Multi-page table footer
│   │   ├── QuickActionModal.tsx         # Command palette (Ctrl+K / Cmd+K)
│   │   ├── WorkspaceHomeTools.tsx       # Shared tasks, approvals, and notifications
│   │   └── index.ts                     # Shared barrel export
│   ├── modules/                         # Bounded Context Domain Modules (Modular Monolith)
│   │   ├── auth/                        # Identity, Terminal session lock, role & plant context
│   │   │   ├── index.ts                 # Public module facade
│   │   │   └── LoginScreen.tsx          # Multi-user biometric/PIN terminal login
│   │   ├── home/                        # Workspace Home command center & tool hubs
│   │   │   ├── index.ts                 # Public module facade
│   │   │   └── HomeView.tsx             # Executive command metrics, quick tiles, alarms
│   │   ├── masterdata/                  # Items, Machine catalog, BOM core master
│   │   │   ├── index.ts                 # Public module facade
│   │   │   └── CreateItemWizardModal.tsx# Multi-step SKU onboarding
│   │   ├── engineering/                 # BOM designer, Multi-level trees, Process routings
│   │   │   ├── index.ts                 # Public module facade
│   │   │   ├── MultiLevelBomTreeView.tsx# Recursive indented bill of materials
│   │   │   └── ProcessRoutingOperationsView.tsx
│   │   ├── manufacturing/               # Shop floor execution, JIT planner, OEE, SMED, Kiosks
│   │   │   ├── index.ts                 # Public module facade
│   │   │   ├── JitSchedulingPlanner.tsx # Real-time machine slotting & recipe consolidation
│   │   │   ├── WorkOrderManager.tsx     # Dispatching, traveler printing & status updates
│   │   │   ├── DailyProductionGrid.tsx  # Shift-wise hourly production & scrap grid
│   │   │   ├── OeeAnalyticsDashboard.tsx# Availability, Performance, Quality analytics
│   │   │   └── ShopFloorKiosk.tsx       # Operator touch terminal with scrap reason codes
│   │   ├── procurement/                 # RFQs, PO management, GRN receipts, Supplier ledger
│   │   │   ├── index.ts                 # Public module facade
│   │   │   └── PurchaseOrderListView.tsx
│   │   ├── warehouse/                   # Inventory ledger, Bins, Putaway, Picking, Regrind
│   │   │   ├── index.ts                 # Public module facade
│   │   │   └── WarehouseBinMapView.tsx  # Visual rack & bin location allocation
│   │   ├── sales/                       # Sales orders, RMAs, Customer credit, Price lists
│   │   ├── finance/                     # Chart of Accounts, Journal vouchers, AP/AR, Costing
│   │   ├── quality/                     # NCRs, CAPAs, COA generator, Calibration, SPC
│   │   ├── hr/                          # Shift rosters, Biometrics, IATF skills, PPE, Payroll
│   │   ├── mep/                         # Mechanical, Electrical, Cleanroom HVAC, Chiller PM
│   │   ├── scm/                         # S&OP, Demand planning, MRP, Inbound/Outbound track
│   │   ├── crm/                         # Deals, Pipelines, Leads, Competitor intelligence
│   │   ├── admin/                       # RBAC matrix, Audit vault, Security policies, Backups
│   │   ├── architecture/                # Technical specification & architecture docs
│   │   └── index.ts                     # Master Domain Registry & Facade Barrel
│   ├── types/                           # Strict TypeScript domain interfaces
│   ├── data/                            # Initial seed fixtures & demo datasets
│   ├── App.tsx                          # Root application coordinator & state orchestrator
│   ├── main.tsx                         # React 18/19 createRoot entry point
│   └── index.css                        # Tailwind CSS global design tokens
├── vite.config.ts                       # Vite build configuration with chunk splitting
├── package.json
└── tsconfig.json`;

  const appRouterCode = `// src/App.tsx — Modular Monolith Routing & View Orchestration
import React, { Suspense, lazy, useState, useTransition } from 'react';
import { Topbar, Sidebar, Drawer, ConfirmModal } from './core';
import {
  HomeView,
  MasterDataViews,
  ManufacturingViews,
  ProcurementViews,
  WarehouseViews,
  SalesViews,
  FinanceViews,
  QualityViews,
  MepViews,
  HrViews,
  ScmViews,
  CrmViews,
  AdminViews,
  ReactArchitectureGuide,
} from './modules';

// Domain views can also be lazy-loaded on demand for optimal initial bundle size:
// const LazyShopFloor = lazy(() => import('./modules/manufacturing').then(m => ({ default: m.ShopFloorKiosk })));

export const AppShell: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('home');
  const [isPending, startTransition] = useTransition();

  const handleNavigate = (view: string) => {
    // Non-blocking navigation using React 19 Concurrent Transitions
    startTransition(() => {
      setCurrentView(view);
    });
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#F6F4EF] text-[#1C1F26] overflow-hidden">
      <Topbar currentView={currentView} onNavigate={handleNavigate} />
      <div className="flex-1 flex min-h-0 overflow-hidden relative w-full">
        <Sidebar currentView={currentView} onNavigate={handleNavigate} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 w-full">
          <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading module...</div>}>
            {currentView === 'home' && <HomeView onNavigate={handleNavigate} />}
            {currentView === 'manufacturing' && <ManufacturingViews />}
            {currentView === 'architectureGuide' && <ReactArchitectureGuide />}
            {/* Additional domain views rendered through their public module facades */}
          </Suspense>
        </main>
      </div>
    </div>
  );
};`;

  const featureModuleCode = `// src/modules/manufacturing/index.ts — Public Module Facade Pattern
// ============================================================================
// DOMAIN MODULE: MANUFACTURING & SHOP FLOOR EXECUTION
// Modular Monolithic Architecture — Reboot ERP
// ============================================================================

// 1. Primary Domain Facade Component
export { ManufacturingViews } from '../../components/ManufacturingViews';

// 2. Granular Specialized Sub-Views
export { MfgCommandCenter } from '../../components/manufacturing/MfgCommandCenter';
export { MfgPlanningBoard } from '../../components/manufacturing/MfgPlanningBoard';
export { WorkOrderManager } from '../../components/manufacturing/WorkOrderManager';
export { WorkOrderDetailTraveler } from '../../components/manufacturing/WorkOrderDetailTraveler';
export { DailyProductionGrid } from '../../components/manufacturing/DailyProductionGrid';
export { MaterialIssuingWorkbench } from '../../components/manufacturing/MaterialIssuingWorkbench';
export { ShopFloorKiosk } from '../../components/manufacturing/ShopFloorKiosk';
export { MachineMonitoringTelemetry } from '../../components/manufacturing/MachineMonitoringTelemetry';
export { ScrapWasteDashboard } from '../../components/manufacturing/ScrapWasteDashboard';
export { DowntimeTrackingView } from '../../components/manufacturing/DowntimeTrackingView';
export { ElectronicBatchRecordView } from '../../components/manufacturing/ElectronicBatchRecordView';
export { BatchGenealogyGraph } from '../../components/manufacturing/BatchGenealogyGraph';
export { MoldToolingManager } from '../../components/manufacturing/MoldToolingManager';
export { ChangeoverSMEDView } from '../../components/manufacturing/ChangeoverSMEDView';
export { OeeAnalyticsDashboard } from '../../components/manufacturing/OeeAnalyticsDashboard';
export { JitSchedulingPlanner } from '../../components/manufacturing/JitSchedulingPlanner';

// 3. Domain Types & Data Entities
export type {
  WorkOrder,
  MachineMaster,
  StockTransaction,
  RejectionBreakdownItem,
  DowntimeIntervalItem,
} from '../../types';`;

  const stateServiceCode = `// src/modules/manufacturing/useWorkOrderStore.ts — Fine-Grained Reactive State Hook
import { useState, useCallback, useMemo } from 'react';
import { WorkOrder, OutputLog } from '../../types';

export function useWorkOrderManager(initialOrders: WorkOrder[]) {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(initialOrders);

  // Memoized Computed Selectors — Zero redundant recalculations
  const activeWorkOrders = useMemo(() =>
    workOrders.filter(w => !['completed', 'cancelled'].includes(w.status)),
    [workOrders]
  );

  const qualityHoldWorkOrders = useMemo(() =>
    workOrders.filter(w => w.status === 'quality_hold'),
    [workOrders]
  );

  const overallScrapRate = useMemo(() => {
    if (!workOrders.length) return 0;
    const totalScrap = workOrders.reduce((sum, w) => sum + (w.scrap || 0), 0);
    const totalCompleted = workOrders.reduce((sum, w) => sum + (w.completed || 1), 0);
    return Number(((totalScrap / totalCompleted) * 100).toFixed(1));
  }, [workOrders]);

  // Atomic Action: Log production output with automatic completion advancement
  const logOutput = useCallback((woId: string, goodQty: number, scrapQty: number, operator: string) => {
    setWorkOrders(prev =>
      prev.map(w => {
        if (w.id !== woId) return w;
        const updatedCompleted = (w.completed || 0) + goodQty;
        const updatedScrap = (w.scrap || 0) + scrapQty;
        const newStatus = updatedCompleted >= w.qty ? 'completed' : w.status;

        const newLog: OutputLog = {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          good: goodQty,
          scrap: scrapQty,
          by: operator,
        };

        return {
          ...w,
          completed: updatedCompleted,
          scrap: updatedScrap,
          status: newStatus,
          outputLogs: [newLog, ...(w.outputLogs || [])],
          history: [
            { event: \`Logged \${goodQty} good / \${scrapQty} scrap\`, time: 'Just now' },
            ...w.history,
          ],
        };
      })
    );
  }, []);

  return {
    workOrders,
    activeWorkOrders,
    qualityHoldWorkOrders,
    overallScrapRate,
    logOutput,
  };
}`;

  const performanceStrategyCode = `// vite.config.ts — Enterprise Code-Splitting & Build Chunking
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    sourcemap: true,
    rollupOptions: {
      output: {
        // Granular Vendor & Domain Chunk Splitting
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-charts': ['recharts'],
          'vendor-icons': ['lucide-react'],
          'vendor-excel': ['xlsx'],
        },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
});

// HIGH-PERFORMANCE REACT ENTERPRISE GUIDELINES:
// 1. React.memo on high-density grid rows (DailyProductionGrid, ItemMaster) to avoid render cascades.
// 2. useTransition for non-blocking UI navigation and complex filter queries.
// 3. Virtualization for 5,000+ SKU stock tables and machine telemetry history.
// 4. Dedicated Web Workers for parsing bulk Excel spreadsheets (e.g. 5,000 lines of BOM items).
// 5. Stable callbacks via useCallback to prevent unnecessary child re-renders.`;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-[#14213D] via-[#1C2B4D] to-[#0E1730] text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-gradient-to-br from-[#E8622C]/20 to-[#0F8B8D]/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-xs font-mono tracking-wider uppercase text-[#DCF0EF] mb-3">
              <Code className="w-3.5 h-3.5 text-[#E8622C]" /> React 19+ Modular Monolith Architecture
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              SP-PLASTECH ERP &mdash; Enterprise React Architecture Guide
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-1.5 leading-relaxed">
              Production-ready technical specification for SP-PLASTECH Plastic Manufacturing ERP built with React 19, TypeScript, Modular Monolithic domain isolation, fine-grained state hooks, and high-throughput rendering.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => copyToClipboard(projectTree, 'tree')}
              className="px-3.5 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 border border-white/20 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
            >
              {copiedCode === 'tree' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>Copy Directory Spec</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E4E0D6] pb-px overflow-x-auto">
        <button
          onClick={() => setActiveTab('architecture')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'architecture'
              ? 'border-[#E8622C] text-[#14213D]'
              : 'border-transparent text-[#6B7280] hover:text-[#14213D]'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          1. Modular Monolith Layout
        </button>
        <button
          onClick={() => setActiveTab('featureModules')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'featureModules'
              ? 'border-[#E8622C] text-[#14213D]'
              : 'border-transparent text-[#6B7280] hover:text-[#14213D]'
          }`}
        >
          <Boxes className="w-4 h-4" />
          2. Domain Bounded Contexts
        </button>
        <button
          onClick={() => setActiveTab('lazyRoutes')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'lazyRoutes'
              ? 'border-[#E8622C] text-[#14213D]'
              : 'border-transparent text-[#6B7280] hover:text-[#14213D]'
          }`}
        >
          <Zap className="w-4 h-4" />
          3. App Routing & Transitions
        </button>
        <button
          onClick={() => setActiveTab('servicesState')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'servicesState'
              ? 'border-[#E8622C] text-[#14213D]'
              : 'border-transparent text-[#6B7280] hover:text-[#14213D]'
          }`}
        >
          <FileCode className="w-4 h-4" />
          4. Reactive State & Stores
        </button>
        <button
          onClick={() => setActiveTab('performance')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'performance'
              ? 'border-[#E8622C] text-[#14213D]'
              : 'border-transparent text-[#6B7280] hover:text-[#14213D]'
          }`}
        >
          <Cpu className="w-4 h-4" />
          5. Performance & Concurrency
        </button>
        <button
          onClick={() => setActiveTab('aiStack')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'aiStack'
              ? 'border-[#E8622C] text-[#14213D]'
              : 'border-transparent text-[#6B7280] hover:text-[#14213D]'
          }`}
        >
          <Sparkles className="w-4 h-4 text-[#E8622C]" />
          6. AI Stack &amp; Streaming UI
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'security'
              ? 'border-[#E8622C] text-[#14213D]'
              : 'border-transparent text-[#6B7280] hover:text-[#14213D]'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-[#0F8B8D]" />
          7. Frontend Security Directives
        </button>
      </div>

      {/* Tab 1: Architecture */}
      {activeTab === 'architecture' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 bg-white rounded-xl border border-[#E4E0D6] shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E4E0D6]">
                <h3 className="font-bold text-sm text-[#14213D] flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-[#0F8B8D]" />
                  Modular Monolithic Workspace Tree (React 19 + TypeScript)
                </h3>
                <button
                  onClick={() => copyToClipboard(projectTree, 'projTree')}
                  className="text-xs font-semibold text-[#0F8B8D] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedCode === 'projTree' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy Tree
                </button>
              </div>
              <pre className="bg-[#14213D] text-slate-200 p-4 rounded-lg font-mono text-xs overflow-x-auto leading-relaxed max-h-[520px]">
                {projectTree}
              </pre>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 bg-white rounded-xl border border-[#E4E0D6] shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-3">Architectural Pillars</h4>
              <div className="space-y-3 text-xs leading-relaxed text-[#1C1F26]">
                <div className="p-3 bg-[#F6F4EF] rounded-lg border border-[#E4E0D6]">
                  <b className="text-[#14213D] block mb-1">1. Domain Bounded Contexts (Modular Monolith)</b>
                  Each ERP domain (Manufacturing, Quality, SCM, Finance, Procurement) resides in its own isolated module under <code className="text-[#E8622C] font-mono">src/modules/</code> with dedicated public barrel exports.
                </div>
                <div className="p-3 bg-[#F6F4EF] rounded-lg border border-[#E4E0D6]">
                  <b className="text-[#14213D] block mb-1">2. Core vs Shared Separation</b>
                  <b>Core</b> holds singleton navigation, Topbar, Sidebar, and shell components. <b>Shared</b> houses purely reusable, unopinionated UI primitives (tables, paginators, modals) with zero domain coupling.
                </div>
                <div className="p-3 bg-[#F6F4EF] rounded-lg border border-[#E4E0D6]">
                  <b className="text-[#14213D] block mb-1">3. Deterministic Unidirectional Data Flow</b>
                  State transitions occur via explicit action handlers with immutable updates. Components subscribe to memoized selectors, eliminating unnecessary re-render cascades.
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#DCF0EF]/40 rounded-xl border border-[#0F8B8D]/30">
              <h4 className="text-xs font-bold uppercase text-[#0F8B8D] mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Enterprise Maintainability Guarantee
              </h4>
              <p className="text-xs text-slate-700 leading-normal">
                By partitioning code by business domain rather than generic technical types, multiple engineering teams can work on independent modules in parallel without merge collisions or tight cross-feature coupling.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Feature Domains */}
      {activeTab === 'featureModules' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-xl border border-[#E4E0D6] shadow-xs">
              <div className="text-xs font-bold uppercase text-[#E8622C] mb-1">Domain 01</div>
              <h3 className="text-base font-bold text-[#14213D]">Master Data & Engineering</h3>
              <p className="text-xs text-[#6B7280] mt-1 mb-3">Item Catalog, Multi-level BOMs, Mold & Machine Registry, Cycle Time Studies.</p>
              <ul className="text-xs space-y-1 text-slate-700 list-disc pl-4">
                <li><code className="text-xs font-mono">ItemMaster</code> with FIFO lot allocation</li>
                <li><code className="text-xs font-mono">MultiLevelBomTree</code> with recursive explosion</li>
                <li><code className="text-xs font-mono">ProcessRouting</code> with operation step timings</li>
              </ul>
            </div>
            <div className="p-4 bg-white rounded-xl border border-[#E4E0D6] shadow-xs">
              <div className="text-xs font-bold uppercase text-[#0F8B8D] mb-1">Domain 02</div>
              <h3 className="text-base font-bold text-[#14213D]">Manufacturing Execution (MES)</h3>
              <p className="text-xs text-[#6B7280] mt-1 mb-3">JIT Machine Planner, Shop Floor Kiosk, Hourly Production Grid, SMED Changeovers.</p>
              <ul className="text-xs space-y-1 text-slate-700 list-disc pl-4">
                <li><code className="text-xs font-mono">JitSchedulingPlanner</code> for mold/recipe slotting</li>
                <li><code className="text-xs font-mono">WorkOrderManager</code> for travelers & dispatch</li>
                <li><code className="text-xs font-mono">OeeAnalytics</code> for availability & performance loss</li>
              </ul>
            </div>
            <div className="p-4 bg-white rounded-xl border border-[#E4E0D6] shadow-xs">
              <div className="text-xs font-bold uppercase text-[#7C5CBF] mb-1">Domain 03</div>
              <h3 className="text-base font-bold text-[#14213D]">Quality & IATF Compliance</h3>
              <p className="text-xs text-[#6B7280] mt-1 mb-3">AQL Sampling, SPC Control Charts, CAPA Stage Gates, Digital Certificates of Analysis.</p>
              <ul className="text-xs space-y-1 text-slate-700 list-disc pl-4">
                <li><code className="text-xs font-mono">SpcMonitorView</code> calculating UCL/LCL/Cp/Cpk</li>
                <li><code className="text-xs font-mono">NcrManagement</code> with containment workflows</li>
                <li><code className="text-xs font-mono">CoaManagement</code> with e-signature sign-offs</li>
              </ul>
            </div>
            <div className="p-4 bg-white rounded-xl border border-[#E4E0D6] shadow-xs">
              <div className="text-xs font-bold uppercase text-[#14213D] mb-1">Domain 04</div>
              <h3 className="text-base font-bold text-[#14213D]">MEP SCADA & Facilities</h3>
              <p className="text-xs text-[#6B7280] mt-1 mb-3">Chillers, 11kV Substation, ETP ZLD, Cleanroom BMS & LOTO Work Orders.</p>
              <ul className="text-xs space-y-1 text-slate-700 list-disc pl-4">
                <li><code className="text-xs font-mono">MepOperationsDash</code> with live telemetry</li>
                <li><code className="text-xs font-mono">CleanroomZone</code> monitoring delta-P & RH%</li>
                <li><code className="text-xs font-mono">MepWorkOrders</code> for scheduled preventative PM</li>
              </ul>
            </div>
          </div>

          <div className="p-5 bg-white rounded-xl border border-[#E4E0D6] shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E4E0D6]">
              <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#E8622C]" />
                Domain Module Facade (<code className="text-xs font-mono">src/modules/manufacturing/index.ts</code>)
              </h3>
              <button
                onClick={() => copyToClipboard(featureModuleCode, 'featModule')}
                className="text-xs font-semibold text-[#0F8B8D] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedCode === 'featModule' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                Copy Code
              </button>
            </div>
            <pre className="bg-[#14213D] text-slate-200 p-4 rounded-lg font-mono text-xs overflow-x-auto leading-relaxed">
              {featureModuleCode}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 3: App Routing & Transitions */}
      {activeTab === 'lazyRoutes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 bg-white rounded-xl border border-[#E4E0D6] shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E4E0D6]">
                <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#E8622C]" />
                  App Routing & Concurrent Transitions (<code className="text-xs font-mono">src/App.tsx</code>)
                </h3>
                <button
                  onClick={() => copyToClipboard(appRouterCode, 'appRoutes')}
                  className="text-xs font-semibold text-[#0F8B8D] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedCode === 'appRoutes' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy Code
                </button>
              </div>
              <pre className="bg-[#14213D] text-slate-200 p-4 rounded-lg font-mono text-xs overflow-x-auto leading-relaxed max-h-[500px]">
                {appRouterCode}
              </pre>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 bg-white rounded-xl border border-[#E4E0D6] shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-3">Routing Optimization Strategies</h4>
              <div className="space-y-3 text-xs text-[#1C1F26]">
                <div className="p-3 bg-[#F6F4EF] rounded-lg border border-[#E4E0D6]">
                  <b className="text-[#14213D] block mb-1">1. Non-Blocking Transitions</b>
                  Using React 19 <code className="text-xs font-mono text-[#0F8B8D]">useTransition</code> keeps typing and user inputs responsive while large module views or analytics charts are mounting.
                </div>
                <div className="p-3 bg-[#F6F4EF] rounded-lg border border-[#E4E0D6]">
                  <b className="text-[#14213D] block mb-1">2. Granular Code-Splitting</b>
                  Domain modules can be lazy-loaded via <code className="text-xs font-mono">React.lazy()</code> so shop floor tablets only fetch MES code without downloading accounting or admin chunks.
                </div>
                <div className="p-3 bg-[#F6F4EF] rounded-lg border border-[#E4E0D6]">
                  <b className="text-[#14213D] block mb-1">3. Error Boundaries & Fallbacks</b>
                  Wrap domain view mounts in React Error Boundaries to prevent runtime crashes in one module from affecting other ERP workspaces.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Reactive State & Stores */}
      {activeTab === 'servicesState' && (
        <div className="space-y-4">
          <div className="p-5 bg-white rounded-xl border border-[#E4E0D6] shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E4E0D6]">
              <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#0F8B8D]" />
                Fine-Grained Reactive State Hook (<code className="text-xs font-mono">useWorkOrderStore.ts</code>)
              </h3>
              <button
                onClick={() => copyToClipboard(stateServiceCode, 'stateCode')}
                className="text-xs font-semibold text-[#0F8B8D] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedCode === 'stateCode' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                Copy Code
              </button>
            </div>
            <pre className="bg-[#14213D] text-slate-200 p-4 rounded-lg font-mono text-xs overflow-x-auto leading-relaxed max-h-[500px]">
              {stateServiceCode}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 5: Performance */}
      {activeTab === 'performance' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 bg-white rounded-xl border border-[#E4E0D6] shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E4E0D6]">
                <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#E8622C]" />
                  Vite Chunking & Production Optimization (<code className="text-xs font-mono">vite.config.ts</code>)
                </h3>
                <button
                  onClick={() => copyToClipboard(performanceStrategyCode, 'perfCode')}
                  className="text-xs font-semibold text-[#0F8B8D] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedCode === 'perfCode' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy Code
                </button>
              </div>
              <pre className="bg-[#14213D] text-slate-200 p-4 rounded-lg font-mono text-xs overflow-x-auto leading-relaxed max-h-[500px]">
                {performanceStrategyCode}
              </pre>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 bg-white rounded-xl border border-[#E4E0D6] shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-3">Key Performance Checks</h4>
              <div className="space-y-2.5 text-xs text-[#1C1F26]">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✔</span>
                  <span><b>Component Memoization:</b> Use <code className="text-xs font-mono">React.memo</code> with custom comparator functions across high-frequency manufacturing grid cells.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✔</span>
                  <span><b>Concurrent Filtering:</b> Utilize <code className="text-xs font-mono">useDeferredValue</code> to keep SKU item search typing smooth while filtering 10,000+ items.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✔</span>
                  <span><b>Web Worker Offloading:</b> Heavy 5,000+ row Excel/CSV parsing runs in Web Workers to prevent frame drops on the main thread.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✔</span>
                  <span><b>Virtual Windowing:</b> Renders only the visible subset of rows in inventory bin ledgers and production schedules.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: AI Stack & Streaming Workloads */}
      {activeTab === 'aiStack' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-xl border border-[#E4E0D6] shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#E8622C]">
                <Sparkles className="w-4 h-4" />
                <span>Directive 1: Streaming UI Architecture</span>
              </div>
              <h3 className="text-sm font-bold text-[#14213D]">
                <code className="text-xs font-mono">&lt;StreamingText /&gt;</code> Engine
              </h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Handles Server-Sent Events (SSE) and WebSockets with an internal token-buffering queue.
                Drains variable network chunk bursts into a smooth, organic typewriter cadence without frame skips or UI freezes.
              </p>
              <div className="text-xs space-y-1 text-slate-700 list-disc pl-4">
                <li><b className="font-mono text-[11px]">EventSource (SSE):</b> Handles <code className="text-[11px] font-mono">onmessage</code>, <code className="text-[11px] font-mono">delta</code>, <code className="text-[11px] font-mono">token</code>, and <code className="text-[11px] font-mono">done</code> events.</li>
                <li><b className="font-mono text-[11px]">WebSocket:</b> Auto-parses JSON stream payloads with completion signals.</li>
                <li><b className="font-mono text-[11px]">Security:</b> Sanitized via DOMPurify to prevent XSS during real-time rendering.</li>
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-[#E4E0D6] shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#0F8B8D]">
                <Cpu className="w-4 h-4" />
                <span>Directive 2: Modular Prompt Builder</span>
              </div>
              <h3 className="text-sm font-bold text-[#14213D]">
                Composable Domain-Driven Components
              </h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Deconstructs prompt engineering into modular, isolated UI primitives that can be assembled together or embedded independently across forms.
              </p>
              <div className="text-xs space-y-1 text-slate-700 list-disc pl-4">
                <li><code className="text-[11px] font-mono font-bold text-[#14213D]">&lt;ContextSelector /&gt;</code>: Domain targets (MES, Quality, SCADA, Silos).</li>
                <li><code className="text-[11px] font-mono font-bold text-[#14213D]">&lt;ToneSlider /&gt;</code>: Output voice &amp; model entropy/temperature control.</li>
                <li><code className="text-[11px] font-mono font-bold text-[#14213D]">&lt;SystemPersonaSelector /&gt;</code>: Pre-configured domain expert roles.</li>
                <li><code className="text-[11px] font-mono font-bold text-[#14213D]">&lt;ContextInjectionToggles /&gt;</code>: Runtime plant &amp; sensor telemetry hooks.</li>
              </div>
            </div>
          </div>

          {/* Live Interactive Prompt Builder Instance */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#E8622C]" />
                Live Interactive Prompt Builder &amp; Streaming Studio
              </h3>
              <span className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Live Interactive Mode
              </span>
            </div>
            <PromptBuilder />
          </div>
        </div>
      )}

      {/* Tab 7: Frontend Security Directives */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Security Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-xl border border-[#E4E0D6] shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#0F8B8D]">
                <Key className="w-4 h-4" />
                <span>Directive 1: Token Management</span>
              </div>
              <h3 className="text-sm font-bold text-[#14213D]">
                Zero Storage Tokens &amp; BFF
              </h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Tokens and JWTs are <b>NEVER</b> stored in <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[11px]">localStorage</code> or <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[11px]">sessionStorage</code>. The frontend communicates exclusively with the BFF gateway using secure <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[11px]">HttpOnly, SameSite=Strict</code> cookies.
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-[#E4E0D6] shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#E8622C]">
                <ShieldCheck className="w-4 h-4" />
                <span>Directive 2: XSS Prevention</span>
              </div>
              <h3 className="text-sm font-bold text-[#14213D]">
                Strict DOMPurify Sanitization
              </h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                All AI-generated text, Markdown, and dynamic user HTML are sanitized via <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[11px]">&lt;SanitizedHtml /&gt;</code> powered by DOMPurify. <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[11px]">dangerouslySetInnerHTML</code> is forbidden without sanitization.
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-[#E4E0D6] shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-indigo-600">
                <Lock className="w-4 h-4" />
                <span>Directive 3: Role-Based UI</span>
              </div>
              <h3 className="text-sm font-bold text-[#14213D]">
                &lt;RequireAuth roles=[...]&gt;
              </h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Conditionally gates view routes and granular UI controls (approval triggers, firmware resets, audit vaults) with zero DOM leakage. Unauthorized elements are not rendered to the client DOM.
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-[#E4E0D6] shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-amber-600">
                <Terminal className="w-4 h-4" />
                <span>Directive 4: Strict CSP Awareness</span>
              </div>
              <h3 className="text-sm font-bold text-[#14213D]">
                Zero Inline Scripts or Eval
              </h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Engineered for strict Content Security Policy enforcement. Zero inline <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[11px]">&lt;script&gt;</code> tags, zero <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[11px]">eval()</code>, zero inline handler attributes, and bundled CSS.
              </p>
            </div>
          </div>

          {/* Interactive Security Sandbox 1: XSS Neutralization with DOMPurify */}
          <div className="p-6 bg-white rounded-xl border border-[#E4E0D6] shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#14213D] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#E8622C]" />
                  <span>Interactive XSS Neutralization Sandbox (DOMPurify)</span>
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Enter malicious attack vectors or simulated AI markup below. DOMPurify strips executable code, event handlers, and dangerous URIs while preserving safe semantic formatting.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTestRawHtml('<div class="p-3 bg-red-50 text-red-900 rounded-lg border border-red-200"><b>Alert:</b> Cavity temp spike on Line 02!<img src=x onerror="console.warn(\'Blocked script execution via DOMPurify\')" /><script>alert("Malicious script blocked!")</script><a href="javascript:stealTokens()" class="underline font-bold text-red-700 ml-2">Click payload link</a></div>')}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                >
                  Load Attack Payload
                </button>
                <button
                  type="button"
                  onClick={() => setTestRawHtml('<div class="p-3 bg-emerald-50 text-emerald-900 rounded-lg border border-emerald-200"><h3><b>Batch #8812 Release Note</b></h3><p>Polypropylene compound verified within <i>ISO 9001:2015</i> quality thresholds. No foreign particulate detected.</p></div>')}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                >
                  Load Clean Markup
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Input Raw HTML */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-slate-500" />
                    Raw Input Markup (Untrusted Source)
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">Editable Live</span>
                </div>
                <textarea
                  rows={6}
                  value={testRawHtml}
                  onChange={(e) => setTestRawHtml(e.target.value)}
                  className="w-full p-3 font-mono text-xs bg-slate-900 text-amber-300 rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-[#E8622C]"
                  placeholder="Type or paste raw HTML markup here..."
                />
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Notice the embedded <code className="font-mono text-amber-700">&lt;script&gt;</code> and <code className="font-mono text-amber-700">onerror</code> attributes above.</span>
                </div>
              </div>

              {/* Sanitized Live Output */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    DOMPurify Sanitized Rendered Output
                  </label>
                  <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                    100% XSS Safe
                  </span>
                </div>
                <div className="min-h-[148px] p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <SanitizedHtml html={testRawHtml} />
                </div>
                <div className="text-[11px] font-mono text-slate-600 bg-slate-100 p-2 rounded border border-slate-200 overflow-x-auto truncate">
                  <b>Sanitized Output String:</b> {sanitizeHtml(testRawHtml)}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Security Sandbox 2: Role-Based UI Guard (<RequireAuth>) */}
          <div className="p-6 bg-white rounded-xl border border-[#E4E0D6] shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#14213D] flex items-center gap-2">
                  <Lock className="w-5 h-5 text-indigo-600" />
                  <span>Role-Based UI Guard Test Bench (&lt;RequireAuth roles=[...]&gt;)</span>
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Simulate different operator authentication levels below to observe conditional UI gating in real-time.
                </p>
              </div>

              {/* Role Simulation Switcher */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
                <span className="text-xs font-semibold text-slate-500 px-2">Simulate Role:</span>
                {(['admin', 'user', 'quality', 'unauthenticated'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSimulatedRole(r)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md capitalize transition-all cursor-pointer ${
                      simulatedRole === r
                        ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Component Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Admin Only */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Admin-Only Component</span>
                  <code className="text-[10px] font-mono bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200">
                    roles=['admin']
                  </code>
                </div>
                <div className="min-h-[72px] flex items-center justify-center bg-white rounded-lg border border-dashed border-slate-300 p-3">
                  <RequireAuth
                    roles={['admin']}
                    currentUser={simulatedRole === 'unauthenticated' ? null : { name: 'Simulated User', role: simulatedRole, id: 'sim-1', email: 'user@reboot.com' }}
                    fallback={
                      <div className="text-center text-xs text-slate-400 flex items-center gap-1.5">
                        <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                        <span>Hidden: Admin clearance required</span>
                      </div>
                    }
                  >
                    <button className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Re-Flash Machine Firmware (Admin)
                    </button>
                  </RequireAuth>
                </div>
                <p className="text-[11px] text-slate-500">
                  Only visible to users holding <code className="font-mono text-indigo-600">admin</code> or Director roles.
                </p>
              </div>

              {/* Card 2: Admin + Standard User */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Operational Component</span>
                  <code className="text-[10px] font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
                    roles=['admin', 'user']
                  </code>
                </div>
                <div className="min-h-[72px] flex items-center justify-center bg-white rounded-lg border border-dashed border-slate-300 p-3">
                  <RequireAuth
                    roles={['admin', 'user']}
                    currentUser={simulatedRole === 'unauthenticated' ? null : { name: 'Simulated User', role: simulatedRole, id: 'sim-1', email: 'user@reboot.com' }}
                    fallback={
                      <div className="text-center text-xs text-slate-400 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Authentication Required</span>
                      </div>
                    }
                  >
                    <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Log Hourly Production Batch
                    </button>
                  </RequireAuth>
                </div>
                <p className="text-[11px] text-slate-500">
                  Visible to both standard authenticated users and administrators.
                </p>
              </div>

              {/* Card 3: Quality Role */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Quality Quarantine Hold</span>
                  <code className="text-[10px] font-mono bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                    roles=['quality']
                  </code>
                </div>
                <div className="min-h-[72px] flex items-center justify-center bg-white rounded-lg border border-dashed border-slate-300 p-3">
                  <RequireAuth
                    roles={['quality']}
                    currentUser={simulatedRole === 'unauthenticated' ? null : { name: 'Simulated User', role: simulatedRole, id: 'sim-1', email: 'user@reboot.com' }}
                    fallback={
                      <div className="text-center text-xs text-slate-400 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Quality Dept Clearance Required</span>
                      </div>
                    }
                  >
                    <button className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Enforce IATF Quarantine Hold
                    </button>
                  </RequireAuth>
                </div>
                <p className="text-[11px] text-slate-500">
                  Visible to Quality Specialists and overarching Administrators.
                </p>
              </div>
            </div>
          </div>

          {/* Architectural Reference Code */}
          <div className="p-6 bg-white rounded-xl border border-[#E4E0D6] shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
              <Code className="w-4 h-4 text-[#0F8B8D]" />
              Production Security Implementations Reference
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-900 rounded-xl font-mono text-xs text-slate-300 space-y-2 overflow-x-auto">
                <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-800">
                  <span>src/shared/api/client.ts (BFF / HttpOnly)</span>
                  <span className="text-[10px] text-emerald-400 font-bold">COOKIE-BASED</span>
                </div>
                <pre className="text-[11px] leading-relaxed text-slate-300">
{`// Centralized API Client (BFF Proxy)
// Security directive: HttpOnly, Secure, SameSite=Strict cookies
export const apiClient = axios.create({
  baseURL: '/api', // Talk ONLY to the BFF
  withCredentials: true, // Transmit secure cookies
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// CRITICAL SECURITY MANDATE:
// ❌ NEVER store JWTs in localStorage or sessionStorage
// ✅ Session is encapsulated exclusively in HttpOnly cookies`}
                </pre>
              </div>

              <div className="p-4 bg-slate-900 rounded-xl font-mono text-xs text-slate-300 space-y-2 overflow-x-auto">
                <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-800">
                  <span>src/shared/components/RequireAuth.tsx</span>
                  <span className="text-[10px] text-indigo-400 font-bold">ZERO DOM LEAKAGE</span>
                </div>
                <pre className="text-[11px] leading-relaxed text-slate-300">
{`// Role-Based UI Guard Wrapper
export const RequireAuth: React.FC<RequireAuthProps> = ({
  roles,
  children,
  fallback = null,
}) => {
  const { currentUser } = useAuthContext();
  if (!currentUser) return <>{fallback}</>;
  if (!roles || roles.length === 0) return <>{children}</>;

  const hasPerm = roles.some(r =>
    currentUser.role?.toLowerCase() === r.toLowerCase() ||
    currentUser.role?.toLowerCase() === 'admin'
  );

  return hasPerm ? <>{children}</> : <>{fallback}</>;
};`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
