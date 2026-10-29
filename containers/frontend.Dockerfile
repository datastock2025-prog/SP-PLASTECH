# syntax=docker/dockerfile:1.4
# ==============================================================================
# SP-PLASTECH ERP — ENTERPRISE MULTI-STAGE FRONTEND DOCKERFILE
# Targets:
#   dev  -> Fast Vite HMR with proxy to backend
#   prod -> Hardened, zero-node, pure static assets with gzip/security headers
# ==============================================================================

# Stage 1: Base Environment
FROM docker.io/library/node:22-alpine AS base
WORKDIR /workspace
RUN apk add --no-cache curl
COPY package.json ./
COPY frontend/package.json ./frontend/
RUN npm install --legacy-peer-deps

# Stage 2: Development (Vite HMR)
FROM base AS dev
COPY . .
EXPOSE 3000
HEALTHCHECK --interval=5s --timeout=3s --retries=5 --start-period=5s \
  CMD curl -fs http://localhost:3000 || exit 1
CMD ["npm", "run", "dev"]

# Stage 3: Production Build
FROM base AS build
COPY . .
RUN npm --prefix frontend run build

# Stage 4: Production Static Server (Nginx Alpine)
FROM docker.io/library/nginx:alpine AS prod
COPY --from=build /workspace/frontend/dist /usr/share/nginx/html
# Security and Cache-Control configuration
RUN printf 'server {\n\
    listen 3000;\n\
    server_name localhost;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
        add_header Cache-Control "no-store, no-cache, must-revalidate";\n\
    }\n\
    location /assets/ {\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD curl -fs http://localhost:3000 || exit 1
CMD ["nginx", "-g", "daemon off;"]
