# syntax=docker/dockerfile:1.4
# ==============================================================================
# SP-PLASTECH ERP — ENTERPRISE MULTI-STAGE MIDDLEWARE DOCKERFILE
# Targets:
#   dev  -> Fast start, hot-reload (tsx watch), bind-mount compatible
#   prod -> Hardened, non-root, minimal attack surface, immutable
# ==============================================================================

# Stage 1: Base Runtime Environment
FROM docker.io/library/node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache curl
COPY package*.json ./

# Stage 2: Development (Hot-reloading via tsx watch)
FROM base AS dev
RUN npm install
COPY . .
EXPOSE 4000
HEALTHCHECK --interval=5s --timeout=3s --retries=5 --start-period=5s \
  CMD curl -fs http://localhost:4000/health || exit 1
CMD ["npm", "run", "dev"]

# Stage 3: Production Dependencies
FROM base AS prod-deps
RUN npm ci --omit=dev && npm cache clean --force

# Stage 4: Production Runtime
FROM docker.io/library/node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache curl && chown -R node:node /app
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package*.json ./
COPY --chown=node:node . .
USER node
EXPOSE 4000
HEALTHCHECK --interval=10s --timeout=3s --retries=3 --start-period=10s \
  CMD curl -fs http://localhost:4000/health || exit 1
CMD ["npx", "tsx", "src/server.ts"]

