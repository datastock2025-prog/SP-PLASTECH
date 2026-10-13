# Module Leaks Register

This document tracks cross-module boundary violations and legacy data leaks identified during the modular monolith migration, along with their resolution strategies.

| Module | File | Line | Violation / Leak Description | Resolution / Target Phase |
| :--- | :--- | :--- | :--- | :--- |
| `sales` | `apps/web/src/modules/sales/components/redesign/SalesOrderWizard.tsx` | 41 | Imports `INITIAL_MOLDS` from legacy `data/manufacturingData.ts` | Data-file leak: deferred to manufacturing module migration when `data/` is deleted and replaced by manufacturing public API/contracts |
| `sales` | `apps/web/src/modules/sales/screens/SalesViews.tsx` | 60 | Imports `recordOutwardDispatchInventoryMovement` from warehouse hook | Resolved via warehouse public module API (`@/src/modules/warehouse`) |
