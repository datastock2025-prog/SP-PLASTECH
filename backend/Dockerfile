# ==============================================================================
# SP-PLASTECH BACKEND DOCKERFILE — MULTI-STAGE OPTIMIZED FOR PRODUCTION
# Base image: Node.js 20 Alpine (Minimal attack surface and memory footprint)
# ==============================================================================

# ------------------------------------------------------------------------------
# STAGE 1: Builder
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache openssl libc6-compat

# Copy dependency manifests
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install all dependencies including devDependencies for build
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code and config
COPY tsconfig*.json nest-cli.json ./
COPY src ./src

# Build production bundle
RUN npm run build

# Prune dev dependencies for lean image
RUN npm prune --production

# ------------------------------------------------------------------------------
# STAGE 2: Production Runner
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Install production runtime dependencies
RUN apk add --no-cache openssl curl dumb-init

# Set node environment
ENV NODE_ENV=production
ENV PORT=3000

# Create dedicated non-root application user and group for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

# Copy node_modules and built artifacts from builder stage
COPY --chown=nestjs:nodejs --from=builder /app/node_modules ./node_modules
COPY --chown=nestjs:nodejs --from=builder /app/package.json ./package.json
COPY --chown=nestjs:nodejs --from=builder /app/dist ./dist
COPY --chown=nestjs:nodejs --from=builder /app/prisma ./prisma

# Switch to non-root user
USER nestjs

# Expose internal backend port
EXPOSE 3000

# Health check to ensure zero-downtime rolling restart
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://127.0.0.1:3000/api/health || exit 1

# Launch with dumb-init for proper signal handling (SIGTERM, SIGINT)
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
