---
name: podman-fast
description: Quick reference cheat sheet and operational protocols for lightning-fast Podman container startups, instant code reloads, WSL2 resource allocation, and production-safe multi-stage builds.
---

# Podman Fast Startup & Production Container Protocols

This skill provides the enterprise standard cheat sheet for managing local Podman development and production builds without startup latency or configuration drift.

## 1. Quick Command Cheat Sheet

| Task | Command | Startup Time | When to Use |
| :--- | :--- | :--- | :--- |
| **Instant Daily Start** | `npm run dev:podman` | **< 2s** | Every day when starting work. Zero rebuild. Uses volume bind mounts. |
| **Dependency Updates** | `npm run dev:podman:build` | ~1m | ONLY when `package.json` dependencies change. |
| **Stop All Containers** | `npm run dev:podman:down` | Instant | Stop all services safely. |
| **Stream Live Logs** | `npm run dev:podman:logs` | Live | Follow combined log streams for db, api, and web. |
| **Restart Backend Only** | `podman restart sp-plastech-dev-api-1` | ~1s | Force re-executing backend process without compose teardown. |
| **Production Build** | `podman compose -f compose.prod.yaml build` | Clean | Creates sealed, read-only, non-root release images. |

---

## 2. Dev vs. Production Container Rules

### Rule 1: Zero Rebuilds in Development
- Never use `--build` during standard edits.
- Middleware mounts `./middleware:/app:Z` and runs `tsx watch src/server.ts` -> file saves reload backend in **<150ms**.
- Anonymous volume `/app/node_modules` runs inside Linux container space to bypass slow Windows filesystem translations.

### Rule 2: Zero Host Code Mounts in Production
- Production containers (`compose.prod.yaml`) MUST NEVER bind-mount host folders (`.:/workspace` or `./middleware:/app` are forbidden in prod).
- All release artifacts are copied into images via multi-stage builds (`target: prod`).
- Production backend runs as unprivileged `node` user with `--read-only` rootfs capability.

### Rule 3: Zero-Cache Browser Delivery
- Local port bridge (`scripts/podman-port-bridge.cjs`) serves `frontend/dist` with `Cache-Control: no-store, no-cache, must-revalidate, max-age=0`.
- Browser hard refresh (**Ctrl + F5**) instantly pulls latest compiled bundles.

---

## 3. WSL2 Engine Configuration (`.wslconfig`)

Located at `C:\Users\<user>\.wslconfig`:
```ini
[wsl2]
vmIdleTimeout=86400000
memory=4GB
processors=3
swap=2GB
localhostForwarding=true
pageReporting=true
```
- **`memory=4GB`**: Prevents WSL2 from competing with Windows for physical RAM on 8GB hosts.
- **`pageReporting=true`**: Tells Linux kernel to release unused memory pages back to Windows host immediately.
- **`localhostForwarding=true`**: Binds container ports directly to Windows `localhost`.

