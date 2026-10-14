# Modular Monolithic Frontend Architecture

## Architectural Overview

This workspace is structured as a **Modular Monolith** for enterprise manufacturing ERP applications. It combines the deployment simplicity and single-bundle developer experience of a monolithic repository with the strict domain isolation, high cohesion, and loose coupling of microservices/modular architectures.

```
src/
├── core/                                # Singleton infrastructure, app shell & navigation
│   ├── index.ts                         # Topbar, Sidebar, Drawer, ConfirmModal, Nav Registry
│   └── ...
├── shared/                              # Cross-cutting UI primitives, tables & base models
│   ├── index.ts                         # AdvancedDataTable, PaginationBar, Modals, Shared Types
│   └── ...
├── modules/                             # Domain Feature Modules (Bounded Contexts)
│   ├── auth/                            # Identity, Terminal session lock, role & plant context
│   ├── home/                            # Workspace Home command center & tool hubs
│   ├── masterdata/                      # Items, Machine catalog, BOM core master
│   ├── engineering/                     # BOM designer, Multi-level trees, Process routings
│   ├── manufacturing/                   # Shop floor execution, JIT planner, OEE, SMED, Kiosks
│   ├── procurement/                     # RFQs, PO management, GRN receipts, Supplier ledger
│   ├── warehouse/                       # Inventory ledger, Bins, Putaway, Picking, Regrind
│   ├── sales/                           # Sales orders, RMAs, Customer credit, Price lists
│   ├── finance/                         # Chart of Accounts, Journal vouchers, AP/AR, Costing
│   ├── quality/                         # NCRs, CAPAs, COA generator, Calibration, SPC
│   ├── hr/                              # Shift rosters, Biometrics, IATF skills, PPE, Payroll
│   ├── mep/                             # Mechanical, Electrical, Cleanroom HVAC, Chiller PM
│   ├── scm/                             # S&OP, Demand planning, MRP, Inbound/Outbound track
│   ├── crm/                             # Deals, Pipelines, Leads, Competitor intelligence
│   ├── admin/                           # RBAC matrix, Audit vault, Security policies, Backups
│   ├── architecture/                    # React 19+ enterprise modular architecture technical specs
│   └── index.ts                         # Central master domain registry & facades
├── App.tsx                              # Application root bootstrapping & state coordinator
└── main.tsx                             # React 18 DOM mount point
```

## Domain Isolation Principles

1. **Self-Contained Modules**: Each feature domain inside `src/modules/<domain>/` encapsulates its components, local data state, and domain-specific types.
2. **Explicit Public Interface (`index.ts`)**: Modules expose a curated public surface via their barrel `index.ts`. Private helpers or sub-components stay internal.
3. **No Direct Deep Coupling**: Outer components interact with feature domains through their module facades or barrel exports.
4. **Preserved Business Logic**: All ERP workflows (JIT calculation, SMED changeover, OEE tracking, Biometric rosters, Financial posting rules) remain authentic and operational.
