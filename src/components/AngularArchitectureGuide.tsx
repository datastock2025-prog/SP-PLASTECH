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
  ExternalLink
} from 'lucide-react';

export const AngularArchitectureGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'featureModules' | 'lazyRoutes' | 'servicesState' | 'performance'>('architecture');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const projectTree = `reboot-angular/
├── src/
│   ├── app/
│   │   ├── core/                        # Singleton core infrastructure (guards, interceptors, auth)
│   │   │   ├── auth/
│   │   │   │   ├── auth.guard.ts        # CanActivateFn for JWT / role authorization
│   │   │   │   ├── auth.service.ts      # Signals-based current user & plant context
│   │   │   │   └── token.interceptor.ts # Functional HttpInterceptorFn (Bearer token inject)
│   │   │   └── error/
│   │   │       └── global-error.handler.ts
│   │   ├── shared/                      # Dumb presentational components & utilities
│   │   │   ├── components/
│   │   │   │   ├── kpi-card/            # Reusable KPI tile with variance/trend
│   │   │   │   ├── data-table/          # Searchable, sortable, paginated generic table
│   │   │   │   ├── status-badge/        # Color-coded ERP status chips
│   │   │   │   ├── drawer/              # Slide-over drawer container
│   │   │   │   └── confirm-dialog/      # Deletion / reversal confirmation modal
│   │   │   ├── directives/              # e.g., autofocus, hasRole, numericOnly
│   │   │   └── pipes/                   # inrCurrency, qtyFormat, daysAgo, timeFormat
│   │   ├── features/                    # Feature-based lazy-loaded domains
│   │   │   ├── master-data/             # Item master, BOMs, Machines & Molds
│   │   │   │   ├── master-data.routes.ts
│   │   │   │   ├── services/item.service.ts
│   │   │   │   ├── components/item-list/
│   │   │   │   └── components/item-detail/
│   │   │   ├── manufacturing/           # Command Center, JIT Board, Work Orders, Shop Floor
│   │   │   │   ├── manufacturing.routes.ts
│   │   │   │   ├── services/work-order.service.ts
│   │   │   │   ├── components/command-center/
│   │   │   │   ├── components/work-order-list/
│   │   │   │   ├── components/production-entry-grid/
│   │   │   │   └── components/shop-floor-console/
│   │   │   ├── warehouse/               # Inventory, Putaway, Picking, Cycle Count, Regrind
│   │   │   │   ├── warehouse.routes.ts
│   │   │   │   └── services/inventory.service.ts
│   │   │   ├── sales/                   # Dashboard, Quotes, SOs, Delivery, RMA, Credit
│   │   │   │   ├── sales.routes.ts
│   │   │   │   └── services/sales.service.ts
│   │   │   ├── finance/                 # COA, Journal Entries, AP 3-Way Match, AR, Product Costing
│   │   │   │   ├── finance.routes.ts
│   │   │   │   └── services/finance.service.ts
│   │   │   ├── quality/                 # QC Command Center, Inspection Plans, SPC, NCR, CAPA, COA
│   │   │   │   ├── quality.routes.ts
│   │   │   │   └── services/quality.service.ts
│   │   │   └── mep/                         # MEP & Central Utilities SCADA, BMS & PM
│   │   │       ├── mep.routes.ts
│   │   │       ├── services/
│   │   │       │   ├── scada-telemetry.service.ts   # WebSocket / SSE real-time sensor gateway
│   │   │       │   └── mep.service.ts               # Equipment, alarms & PM work order REST API
│   │   │       ├── stores/mep.store.ts              # Angular Signals (equipment state, alarm stream)
│   │   │       └── components/
│   │   │           ├── mep-command-center/
│   │   │           ├── mechanical-chillers/
│   │   │           ├── electrical-substation/
│   │   │           ├── plumbing-water-etp/
│   │   │           ├── hvac-cleanrooms/
│   │   │           └── mep-work-orders/
│   │   ├── layout/                      # Application shell
│   │   │   ├── app-shell.component.ts   # Router-outlet wrapper
│   │   │   ├── sidebar/                 # Navigation menu with module groups
│   │   │   └── topbar/                  # Breadcrumbs, universal search, user avatar
│   │   ├── app.config.ts                # Application providers (Router, HttpClient, Signals)
│   │   ├── app.routes.ts                # Root lazy loading routing manifest
│   │   └── app.component.ts             # Root entry component
│   ├── assets/                          # Static icons, styles, fonts
│   ├── styles/                          # Tailwind v4 / Global CSS variables
│   └── main.ts                          # Bootstrap: bootstrapApplication(AppComponent, appConfig)
├── angular.json
├── package.json
└── tsconfig.json`;

  const appRoutesCode = `// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from './core/auth/auth.guard';
import { AppShellComponent } from './layout/app-shell.component';

export const APP_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        loadComponent: () => import('./features/home/workspace-home.component').then(m => m.WorkspaceHomeComponent)
      },
      {
        path: 'master-data',
        loadChildren: () => import('./features/master-data/master-data.routes').then(m => m.MASTER_DATA_ROUTES)
      },
      {
        path: 'manufacturing',
        loadChildren: () => import('./features/manufacturing/manufacturing.routes').then(m => m.MANUFACTURING_ROUTES)
      },
      {
        path: 'warehouse',
        loadChildren: () => import('./features/warehouse/warehouse.routes').then(m => m.WAREHOUSE_ROUTES)
      },
      {
        path: 'sales',
        loadChildren: () => import('./features/sales/sales.routes').then(m => m.SALES_ROUTES)
      },
      {
        path: 'finance',
        loadChildren: () => import('./features/finance/finance.routes').then(m => m.FINANCE_ROUTES)
      },
      {
        path: 'quality',
        loadChildren: () => import('./features/quality/quality.routes').then(m => m.QUALITY_ROUTES)
      },
      {
        path: 'mep',
        loadChildren: () => import('./features/mep/mep.routes').then(m => m.MEP_ROUTES)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];`;

  const featureRoutesCode = `// src/app/features/manufacturing/manufacturing.routes.ts
import { Routes } from '@angular/router';

export const MANUFACTURING_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'command-center',
    pathMatch: 'full'
  },
  {
    path: 'command-center',
    loadComponent: () => import('./components/command-center/command-center.component')
      .then(m => m.CommandCenterComponent),
    title: 'Manufacturing Command Center — Reboot'
  },
  {
    path: 'planning-board',
    loadComponent: () => import('./components/planning-board/planning-board.component')
      .then(m => m.PlanningBoardComponent),
    title: 'Production Planning Board — Reboot'
  },
  {
    path: 'work-orders',
    loadComponent: () => import('./components/work-order-list/work-order-list.component')
      .then(m => m.WorkOrderListComponent),
    title: 'Work Orders — Reboot'
  },
  {
    path: 'work-orders/:id',
    loadComponent: () => import('./components/work-order-detail/work-order-detail.component')
      .then(m => m.WorkOrderDetailComponent),
    title: 'Work Order Detail — Reboot'
  },
  {
    path: 'production-entry-grid',
    loadComponent: () => import('./components/production-entry-grid/production-entry-grid.component')
      .then(m => m.ProductionEntryGridComponent),
    title: 'Production Entry Grid — Reboot'
  },
  {
    path: 'shop-floor',
    loadComponent: () => import('./components/shop-floor-console/shop-floor-console.component')
      .then(m => m.ShopFloorConsoleComponent),
    title: 'Shop Floor Console — Reboot'
  },
  {
    path: 'oee-analytics',
    loadComponent: () => import('./components/oee-analytics/oee-analytics.component')
      .then(m => m.OeeAnalyticsComponent),
    title: 'OEE Analytics — Reboot'
  }
];`;

  const stateServiceCode = `// src/app/features/manufacturing/services/work-order.service.ts
import { Injectable, computed, signal } from '@angular/core';
import { WorkOrder, OutputLog, DowntimeLog } from '../../../shared/models/erp.models';

@Injectable({
  providedIn: 'root'
})
export class WorkOrderService {
  // Primary reactive state using Angular Signals
  private workOrdersSignal = signal<WorkOrder[]>([]);
  public readonly workOrders = this.workOrdersSignal.asReadonly();

  // Computed business logic signals
  public readonly activeWorkOrders = computed(() =>
    this.workOrdersSignal().filter(w => !['completed', 'cancelled'].includes(w.status))
  );

  public readonly qualityHoldWorkOrders = computed(() =>
    this.workOrdersSignal().filter(w => w.status === 'quality_hold')
  );

  public readonly overallScrapRate = computed(() => {
    const orders = this.workOrdersSignal();
    if (!orders.length) return 0;
    const totalScrap = orders.reduce((sum, w) => sum + (w.scrap || 0), 0);
    const totalCompleted = orders.reduce((sum, w) => sum + (w.completed || 1), 0);
    return Number(((totalScrap / totalCompleted) * 100).toFixed(1));
  });

  // Business Action: Log output with automatic state advancement
  public logOutput(woId: string, goodQty: number, scrapQty: number, operator: string): void {
    this.workOrdersSignal.update(orders =>
      orders.map(w => {
        if (w.id !== woId) return w;
        const updatedCompleted = w.completed + goodQty;
        const updatedScrap = w.scrap + scrapQty;
        const newStatus = updatedCompleted >= w.qty ? 'completed' : w.status;

        const newLog: OutputLog = {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          good: goodQty,
          scrap: scrapQty,
          by: operator
        };

        return {
          ...w,
          completed: updatedCompleted,
          scrap: updatedScrap,
          status: newStatus,
          outputLogs: [newLog, ...(w.outputLogs || [])],
          history: [
            { event: \`Logged \${goodQty} good / \${scrapQty} scrap\`, time: 'Just now' },
            ...w.history
          ]
        };
      })
    );
  }

  // Business Action: Change status with audit trail
  public updateStatus(woId: string, status: WorkOrder['status'], reason?: string): void {
    this.workOrdersSignal.update(orders =>
      orders.map(w => {
        if (w.id !== woId) return w;
        return {
          ...w,
          status,
          history: [
            { event: \`Status changed to \${status}\${reason ? ' (' + reason + ')' : ''}\`, time: 'Just now' },
            ...w.history
          ]
        };
      })
    );
  }
}`;

  const performanceStrategyCode = `// src/app/app.config.ts
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withPreloading, PreloadAllModules, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { APP_ROUTES } from './app.routes';
import { authInterceptor } from './core/auth/token.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // 1. Coalesced event change detection for 60fps high-throughput UI
    provideZoneChangeDetection({ eventCoalescing: true }),

    // 2. Optimized router with preloading and view transitions
    provideRouter(
      APP_ROUTES,
      withComponentInputBinding(),
      withPreloading(PreloadAllModules), // Or Custom QuicklinkStrategy
      withViewTransitions()
    ),

    // 3. Functional HTTP client with interceptors
    provideHttpClient(
      withInterceptors([authInterceptor])
    )
  ]
};

// HIGH PERFORMANCE GUIDELINES FOR PLASTIC ERP:
// 1. ChangeDetectionStrategy.OnPush across all table rows & data visualizers.
// 2. Use Angular 17+ @for loops with strict 'track item.code' or 'track wo.id' keys.
// 3. Virtual Scrolling (@angular/cdk/scrolling) for 1,000+ SKU Item Master and Production Grids.
// 4. Heavy Excel / CSV parsing executed in Dedicated Web Workers (worker.ts).
// 5. Signals for synchronous atomic reactivity without change-detection cascades.`;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-[#14213D] via-[#1C2B4D] to-[#0E1730] text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-gradient-to-br from-[#E8622C]/20 to-[#0F8B8D]/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-xs font-mono tracking-wider uppercase text-[#DCF0EF] mb-3">
              <Code className="w-3.5 h-3.5 text-[#E8622C]" /> Angular 18+ Standalone Architecture Blueprint
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Reboot &mdash; Enterprise Angular Migration Guide
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-1.5 leading-relaxed">
              Complete, production-ready blueprint to convert the Reboot Plastic Manufacturing ERP into an enterprise Angular application with standalone feature modules, lazy routing, Signals state management, and high-performance rendering.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => copyToClipboard(projectTree, 'tree')}
              className="btn btn-sm bg-white/10 text-white hover:bg-white/20 border-white/20"
            >
              {copiedCode === 'tree' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              Copy Directory Spec
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E4E0D6] pb-px overflow-x-auto">
        <button
          onClick={() => setActiveTab('architecture')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'architecture'
              ? 'border-[#E8622C] text-[#14213D]'
              : 'border-transparent text-[#6B7280] hover:text-[#14213D]'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          1. File Architecture & Directory Layout
        </button>
        <button
          onClick={() => setActiveTab('featureModules')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'featureModules'
              ? 'border-[#E8622C] text-[#14213D]'
              : 'border-transparent text-[#6B7280] hover:text-[#14213D]'
          }`}
        >
          <Layers className="w-4 h-4" />
          2. Feature-Based Scalability
        </button>
        <button
          onClick={() => setActiveTab('lazyRoutes')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'lazyRoutes'
              ? 'border-[#E8622C] text-[#14213D]'
              : 'border-transparent text-[#6B7280] hover:text-[#14213D]'
          }`}
        >
          <Zap className="w-4 h-4" />
          3. Lazy Loading & Route Tree
        </button>
        <button
          onClick={() => setActiveTab('servicesState')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'servicesState'
              ? 'border-[#E8622C] text-[#14213D]'
              : 'border-transparent text-[#6B7280] hover:text-[#14213D]'
          }`}
        >
          <FileCode className="w-4 h-4" />
          4. Signals State & Business Logic
        </button>
        <button
          onClick={() => setActiveTab('performance')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'performance'
              ? 'border-[#E8622C] text-[#14213D]'
              : 'border-transparent text-[#6B7280] hover:text-[#14213D]'
          }`}
        >
          <Cpu className="w-4 h-4" />
          5. Performance & OnPush Optimization
        </button>
      </div>

      {/* Tab 1: Architecture */}
      {activeTab === 'architecture' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="panel p-5">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E4E0D6]">
                <h3 className="font-bold text-sm text-[#14213D] flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-[#0F8B8D]" />
                  Modular Standalone Project Structure (Angular 18+)
                </h3>
                <button
                  onClick={() => copyToClipboard(projectTree, 'projTree')}
                  className="text-xs font-semibold text-[#0F8B8D] hover:underline flex items-center gap-1"
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
            <div className="side-block">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-3">Architectural Pillars</h4>
              <div className="space-y-3 text-xs leading-relaxed text-[#1C1F26]">
                <div className="p-3 bg-[#F6F4EF] rounded-lg border border-[#E4E0D6]">
                  <b className="text-[#14213D] block mb-1">1. Zero NgModule Friction (Standalone First)</b>
                  All components, directives, and pipes declare <code className="text-[#E8622C]">standalone: true</code>. Imports are granular, self-contained, and perfectly tree-shakeable.
                </div>
                <div className="p-3 bg-[#F6F4EF] rounded-lg border border-[#E4E0D6]">
                  <b className="text-[#14213D] block mb-1">2. Core vs Shared vs Feature Separation</b>
                  <b>Core</b> holds singletons, interceptors and auth. <b>Shared</b> houses purely presentational widgets with zero domain coupling. <b>Features</b> own their domain models, routes, and services.
                </div>
                <div className="p-3 bg-[#F6F4EF] rounded-lg border border-[#E4E0D6]">
                  <b className="text-[#14213D] block mb-1">3. Deterministic Unidirectional Data Flow</b>
                  State mutations happen strictly via Service action methods. Views read fine-grained <code className="text-[#0F8B8D]">computed()</code> Signals, eliminating zone over-triggering.
                </div>
              </div>
            </div>

            <div className="panel p-4 bg-[#DCF0EF]/40 border-[#0F8B8D]/30">
              <h4 className="text-xs font-bold uppercase text-[#0F8B8D] mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Enterprise Maintainability Guarantee
              </h4>
              <p className="text-xs text-slate-700 leading-normal">
                By partitioning by business boundary (Master Data, Manufacturing, Warehouse, Sales, Finance, Quality) rather than technical type, multiple engineering squads can work in parallel on distinct ERP domains with zero merge collisions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Feature-Based Scalability */}
      {activeTab === 'featureModules' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="panel p-4">
              <div className="text-xs font-bold uppercase text-[#E8622C] mb-1">Domain 01</div>
              <h3 className="text-base font-bold text-[#14213D]">Master Data & Engineering</h3>
              <p className="text-xs text-[#6B7280] mt-1 mb-3">Item Catalog, Multi-level BOM / Recipes, Machine & Mold Registry, Cycle Time Studies.</p>
              <ul className="text-xs space-y-1 text-slate-700 list-disc pl-4">
                <li><code className="text-xs font-mono">ItemService</code> with FIFO lot allocation</li>
                <li><code className="text-xs font-mono">BomService</code> with recursive cost rollups</li>
                <li><code className="text-xs font-mono">MachineService</code> with tonnage & cavity validation</li>
              </ul>
            </div>
            <div className="panel p-4">
              <div className="text-xs font-bold uppercase text-[#0F8B8D] mb-1">Domain 02</div>
              <h3 className="text-base font-bold text-[#14213D]">Manufacturing Operations</h3>
              <p className="text-xs text-[#6B7280] mt-1 mb-3">Shop Floor Console, JIT Board, Inline Production Entry, Live Telemetry, SMED Changeover.</p>
              <ul className="text-xs space-y-1 text-slate-700 list-disc pl-4">
                <li><code className="text-xs font-mono">WorkOrderService</code> with output/downtime logging</li>
                <li><code className="text-xs font-mono">PegGridService</code> with inline batch calculation</li>
                <li><code className="text-xs font-mono">OeeAnalyticsService</code> with availability/quality loss</li>
              </ul>
            </div>
            <div className="panel p-4">
              <div className="text-xs font-bold uppercase text-[#7C5CBF] mb-1">Domain 03</div>
              <h3 className="text-base font-bold text-[#14213D]">Quality Intelligence</h3>
              <p className="text-xs text-[#6B7280] mt-1 mb-3">AQL Sampling Plans, SPC Control Charts, 5-Why / Fishbone RCA, CAPA Stage Gates, Digital COAs.</p>
              <ul className="text-xs space-y-1 text-slate-700 list-disc pl-4">
                <li><code className="text-xs font-mono">SpcService</code> calculating UCL/LCL/Cp/Cpk</li>
                <li><code className="text-xs font-mono">NcrService</code> with auto-containment workflows</li>
                <li><code className="text-xs font-mono">CoaService</code> with 21 CFR Part 11 e-signatures</li>
              </ul>
            </div>
            <div className="panel p-4">
              <div className="text-xs font-bold uppercase text-[#14213D] mb-1">Domain 04</div>
              <h3 className="text-base font-bold text-[#14213D]">MEP & Plant Utilities SCADA</h3>
              <p className="text-xs text-[#6B7280] mt-1 mb-3">Chillers, 11kV Substation, ETP ZLD, Cleanroom BMS &amp; LOTO Work Orders.</p>
              <ul className="text-xs space-y-1 text-slate-700 list-disc pl-4">
                <li><code className="text-xs font-mono">ScadaTelemetryService</code> with WebSocket / SSE feed</li>
                <li><code className="text-xs font-mono">MepStore</code> Signals store with alarm streaming</li>
                <li><code className="text-xs font-mono">LotoService</code> with isolation lockouts &amp; permits</li>
              </ul>
            </div>
          </div>

          <div className="panel p-5">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E4E0D6]">
              <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#E8622C]" />
                Feature Route Definition Pattern (<code className="text-xs font-mono">manufacturing.routes.ts</code>)
              </h3>
              <button
                onClick={() => copyToClipboard(featureRoutesCode, 'featRoutes')}
                className="text-xs font-semibold text-[#0F8B8D] hover:underline flex items-center gap-1"
              >
                {copiedCode === 'featRoutes' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                Copy Code
              </button>
            </div>
            <pre className="bg-[#14213D] text-slate-200 p-4 rounded-lg font-mono text-xs overflow-x-auto leading-relaxed">
              {featureRoutesCode}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 3: Lazy Loading Routes */}
      {activeTab === 'lazyRoutes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="panel p-5">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E4E0D6]">
                <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#E8622C]" />
                  Root Lazy Loading Manifest (<code className="text-xs font-mono">app.routes.ts</code>)
                </h3>
                <button
                  onClick={() => copyToClipboard(appRoutesCode, 'appRoutes')}
                  className="text-xs font-semibold text-[#0F8B8D] hover:underline flex items-center gap-1"
                >
                  {copiedCode === 'appRoutes' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy Code
                </button>
              </div>
              <pre className="bg-[#14213D] text-slate-200 p-4 rounded-lg font-mono text-xs overflow-x-auto leading-relaxed max-h-[500px]">
                {appRoutesCode}
              </pre>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="side-block">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-3">Route Optimization Strategies</h4>
              <div className="space-y-3 text-xs text-[#1C1F26]">
                <div className="p-3 bg-[#F6F4EF] rounded-lg border border-[#E4E0D6]">
                  <b className="text-[#14213D] block mb-1">1. Granular Code Splitting</b>
                  Each domain compiles to its own discrete chunk (e.g., <code className="text-xs font-mono">chunk-manufacturing.js</code> ~42KB). Users on the shop floor only download the manufacturing bundle, reducing initial payload by ~70%.
                </div>
                <div className="p-3 bg-[#F6F4EF] rounded-lg border border-[#E4E0D6]">
                  <b className="text-[#14213D] block mb-1">2. Intelligent Preloading</b>
                  Using <code className="text-xs font-mono text-[#0F8B8D]">PreloadAllModules</code> or an idle-time Quicklink strategy downloads adjacent modules in the background once the primary shell renders, giving instantaneous tab navigation.
                </div>
                <div className="p-3 bg-[#F6F4EF] rounded-lg border border-[#E4E0D6]">
                  <b className="text-[#14213D] block mb-1">3. Functional Route Guards</b>
                  Use lightweight functional guards (<code className="text-xs font-mono">CanActivateFn</code>) instead of deprecated class guards to verify plant authorization and prevent unauthorized module chunk downloads.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Services & Signals */}
      {activeTab === 'servicesState' && (
        <div className="space-y-4">
          <div className="panel p-5">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E4E0D6]">
              <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#0F8B8D]" />
                Signals-Powered State Service (<code className="text-xs font-mono">work-order.service.ts</code>)
              </h3>
              <button
                onClick={() => copyToClipboard(stateServiceCode, 'stateCode')}
                className="text-xs font-semibold text-[#0F8B8D] hover:underline flex items-center gap-1"
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
            <div className="panel p-5">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E4E0D6]">
                <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#E8622C]" />
                  Application Config & Performance Setup (<code className="text-xs font-mono">app.config.ts</code>)
                </h3>
                <button
                  onClick={() => copyToClipboard(performanceStrategyCode, 'perfCode')}
                  className="text-xs font-semibold text-[#0F8B8D] hover:underline flex items-center gap-1"
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
            <div className="side-block">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-3">Key Performance Checks</h4>
              <div className="space-y-2.5 text-xs text-[#1C1F26]">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✔</span>
                  <span><b>Strict OnPush Everywhere:</b> Eliminates redundant sub-tree re-evaluations during rapid operator entry.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✔</span>
                  <span><b>Built-in Control Flow (@for/@if):</b> Replaces <code className="text-xs font-mono">*ngFor</code> with compile-time optimized loops and mandatory tracking.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✔</span>
                  <span><b>Web Worker Offloading:</b> 5,000+ line Excel imports parsed in background workers without blocking the main rendering thread.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✔</span>
                  <span><b>CDK Virtual Scroll:</b> Renders only the 25 DOM elements in view on large bill-of-materials and warehouse bin tables.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
