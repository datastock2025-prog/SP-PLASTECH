# Graphify — Dependency & Blast Radius Rules

Before performing global changes across the repository:

1. **Dependency Mapping**:
   - Always trace every caller of a shared utility, column helper, router, or schema definition prior to refactoring.
   - For database columns and Drizzle schemas, identify all affected migrations, DTO mappers, API route validators, and frontend forms.

2. **Decoupling God Nodes**:
   - Decompose monolithic hubs (like `middleware/src/routes.ts` and `App.tsx`) into decoupled domain modules (`middleware/src/modules/<domain>/routes.ts` and modular web route manifests).
   - Use centralized contracts (`packages/contracts` or generated OpenAPI definitions) at domain boundaries.

3. **Verification**:
   - Run circular dependency checks (`npm run check:circular`) and architectural boundary checks (`npm run check:boundaries`) after structural changes.
