# syntax=docker/dockerfile:1.7

# ==============================================================================
# Dockerfile — NestJS API (Turborepo monorepo)
# ==============================================================================

ARG NODE_VERSION=20-alpine

# ------------------------------------------------------------------------------
# Stage 1: Prune monorepo to only what the API needs
# ------------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS pruner
WORKDIR /app

# Install Turbo globally for monorepo pruning.
RUN npm install -g turbo@2

COPY . .
RUN turbo prune @repo/api --docker

# out/json/ — package manifests and lockfile for dependency installation.
# out/full/ — pruned source code for the build.

# ------------------------------------------------------------------------------
# Stage 2: Install production dependencies only
# ------------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS prod-deps
WORKDIR /app

RUN corepack enable

COPY --from=pruner /app/out/json/ .

# Use BuildKit cache to speed up pnpm installs.
# Ignore lifecycle scripts; required build steps are run explicitly later.
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --prod --frozen-lockfile --ignore-scripts

# ------------------------------------------------------------------------------
# Stage 3: Build the API
# ------------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS builder
WORKDIR /app

RUN corepack enable

COPY --from=pruner /app/out/json/ .

# Install dependencies required for the build.
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

# Copy pruned source code.
COPY --from=pruner /app/out/full/ .

# Reuse Turbo's build cache between builds.
RUN --mount=type=cache,id=turbo-cache,target=/app/.turbo \
    pnpm turbo run build --filter=@repo/api

# ------------------------------------------------------------------------------
# Stage 4: Minimal production runtime
# ------------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS runner

LABEL org.opencontainers.image.title="quizz-backend-api"
LABEL org.opencontainers.image.description="Enterprise Quiz Platform NestJS API"

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=10000
ENV NODE_OPTIONS="--max-old-space-size=400"

# dumb-init handles signals correctly; wget is used by the healthcheck.
RUN apk add --no-cache dumb-init wget

# Run the application as a non-root user.
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Copy production-only dependencies.
COPY --from=prod-deps --chown=appuser:appgroup \
    /app/node_modules ./node_modules

COPY --from=prod-deps --chown=appuser:appgroup \
    /app/apps/api/node_modules ./apps/api/node_modules

# Copy only the compiled application.
COPY --from=builder --chown=appuser:appgroup \
    /app/apps/api/dist ./dist

COPY --from=builder --chown=appuser:appgroup \
    /app/apps/api/package.json ./package.json

USER appuser

EXPOSE ${PORT}

# Local/container healthcheck. Configure the same path in Render separately.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider \
    http://localhost:${PORT}/api/v1/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]