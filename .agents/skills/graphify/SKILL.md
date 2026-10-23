---
name: graphify
description: >
  Codebase knowledge graph and AST dependency traversal. Use to map module boundaries,
  caller/callee graphs, database relations, and API-to-UI contracts before executing
  refactors or global changes.
license: MIT
---

# Graphify — Codebase Knowledge Graph & Structural Analysis

Graphify turns the codebase into a structured dependency and relational graph before modifying global systems.

## Core Rules

1. **Map Before Mutation**:
   - Before editing shared types, database schemas, or base routers, trace the blast radius across upstream callers and downstream consumers.
   - Categorize nodes:
     - **Core Root Nodes**: `db`, `schema`, `columns.ts`, `withTx`, `http.ts`.
     - **Domain Slices**: `src/features/*`, `middleware/src/modules/*`, `frontend/apps/web/src/modules/*`.
     - **Leaf Consumers**: UI views, forms, E2E specs.

2. **AST & Relationship Traversal**:
   - Trace Foreign Key chains (e.g. `tenants -> plants -> items -> sales_order_lines`).
   - Trace Route-to-Hook-to-Component pipelines (`Hono route -> createResourceApi -> useQuery hook -> EntityTable / EntityDrawer`).
   - Flag "God Nodes" (e.g., monolithic `routes.ts`, `App.tsx` global state) and plan clean decoupling into domain clusters.

3. **Validation & Boundary Integrity**:
   - Verify zero circular dependencies using `madge` / `dependency-cruiser`.
   - Prevent cross-domain leaks (e.g. `sales` directly importing `warehouse` internal implementation instead of contracts).
   - Ensure contract adherence between Backend Drizzle Schema <-> OpenAPI Contract <-> Frontend Typed Client.
