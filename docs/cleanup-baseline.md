# SP-PLASTECH ERP — Cleanup Baseline Report (Phase 0.1)

**Execution Date**: 2026-10-12  
**Branch**: `cleanup/phase-0`  
**Environment**: Local (Windows / Node.js v24.19.0 / Podman available)  

---

## 1. Safety Net Baseline Results

| Check | Status | Duration | Details |
| :--- | :--- | :--- | :--- |
| **`npm ci` / Dependencies** | ✅ Clean | — | Dependencies installed; Vite 6.2.3, React 19, TypeScript 5.8.2 |
| **`npx tsc --noEmit`** | ✅ PASS | ~35s | 0 TypeScript errors across entire frontend codebase |
| **`npx playwright test`** | ❌ FAIL | ~12s | Failed at `e2e/global-setup.ts:22` during admin bootstrap sign-in |

---

## 2. Playwright Failure Analysis & Chain Breakdown

```
Error: E2E setup: could not sign in with the admin or bootstrap password
   at global-setup.ts:22
```

### Root Cause
1. In `playwright.config.ts`, `webServer` spins up `npm run start` in `./auth-server` on port 4000.
2. `global-setup.ts` attempts to authenticate via `http://127.0.0.1:4000/api/auth/sign-in/username`.
3. When `auth-server` attempts to connect to embedded postgres (`reboot_auth` on port 54329), it encountered `ECONNRESET`, or the existing credentials did not match the unrotated bootstrap password.
4. Per Phase 0.2 instructions: This represents an existing broken connection that will be connected cleanly in **Phase 3: CONNECT** (One API path: `web -> /api -> Hono`, unified `compose.yaml` with Podman Postgres 16 + API + Web).
