# Reboot ERP Workspace Architecture

## Current development topology

- `frontend`: the Vite/React ERP application on port 3000.
- `backend`: Node.js / Prisma backend service on port 3000 (mapped to 3002).
- `postgres`: PostgreSQL 16 database on port 5432.
- The frontend calls `/api`; the Vite dev proxy forwards that path to the `backend` service. All interaction with the legacy `middleware/` folder is decommissioned.

## Direction for future development

The `backend` is the sole boundary between the frontend and the database for REST operations. 

### Data Flow & Realtime Synchronization Protocols
1. **TanStack React Query Cache as SSOT**: Data fetching is managed via `useQuery` with `staleTime: 5 minutes` and `refetchOnWindowFocus: true`.
2. **Centralized Query Invalidation**: When any mutation executes (`useSaveItem`, `useDeleteItem`, `useApproveItem`), it calls `queryClient.invalidateQueries({ queryKey: ['masterData'] })` and `queryClient.invalidateQueries({ queryKey: ['items'] })`. React Query cancels stale in-flight requests and refetches the latest committed row directly from PostgreSQL.
3. **Native PostgreSQL CDC WebSockets**: Instead of tab-level broadcast channels, `src/services/realtime/supabaseRealtime.ts` listens to database CDC change events from Supabase and automatically invalidates the React Query cache across all browsers (Chrome, Brave, Edge).

## Local commands

```powershell
podman compose up --build
podman compose down
podman compose down -v  # removes the local PostgreSQL volume
```

Health checks:

- `http://localhost:3002/health`
- `http://localhost:3000`

On Windows with the Podman WSL machine, use the machine IP if `localhost` is not forwarded. Find it with `podman machine ssh "ip -4 addr show eth0"`, then open `http://<podman-ip>:3000`.
