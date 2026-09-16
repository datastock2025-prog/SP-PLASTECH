# Reboot ERP Workspace Architecture

## Current development topology

- `frontend`: the existing Vite/React ERP application on port 3000.
- `middleware`: NestJS application and API boundary on port 3001.
- `postgres`: PostgreSQL 16 database on port 5432.
- The frontend calls `/api`; the Vite dev proxy forwards that path to NestJS.

## Direction for future development

The middleware is intentionally the boundary between the frontend and the database. New ERP domains should be organized as NestJS modules with explicit API contracts and should not connect directly from the frontend to PostgreSQL.

When domain load or ownership requires it, modules can be extracted into independently deployable microservices behind the middleware boundary. The target architecture is hybrid: keep shared cross-cutting concerns such as authentication, authorization, API composition, audit, and rate limiting in the middleware, while allowing high-volume or independently owned domains to move to services with their own data access and deployment lifecycle.

## Local commands

```powershell
podman compose up --build
podman compose down
podman compose down -v  # removes the local PostgreSQL volume
```

Health checks:

- `http://localhost:3001/api/health`
- `http://localhost:3001/api/health/db`
- `http://localhost:3000`

On Windows with the Podman WSL machine, use the machine IP if `localhost` is not forwarded. Find it with `podman machine ssh "ip -4 addr show eth0"`, then open `http://<podman-ip>:3000` or `http://<podman-ip>:3001/api/health`.
