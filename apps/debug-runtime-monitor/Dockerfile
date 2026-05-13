# syntax=docker/dockerfile:1.7

# --------- base -----------
FROM --platform=$BUILDPLATFORM node:22-alpine AS base
WORKDIR /app

ENV CI=true
ENV HUSKY=0
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable pnpm

# --------- deps -----------
FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY apps/debug-runtime-monitor/package.json apps/debug-runtime-monitor/package.json

RUN --mount=type=cache,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile --ignore-scripts --filter @fastgpt-plugin/debug-runtime-monitor...

# --------- builder -----------
FROM deps AS builder

COPY apps/debug-runtime-monitor apps/debug-runtime-monitor

RUN pnpm --filter @fastgpt-plugin/debug-runtime-monitor build

# --------- runner -----------
FROM --platform=$TARGETPLATFORM node:22-alpine AS runner
WORKDIR /app

RUN addgroup -S fastgpt \
    && adduser -S -G fastgpt fastgpt

COPY --from=builder --chown=fastgpt:fastgpt /app/apps/debug-runtime-monitor/dist ./dist
COPY --chown=fastgpt:fastgpt apps/debug-runtime-monitor/server.mjs ./server.mjs

ENV NODE_ENV=production
ENV PORT=8080
ENV RUNTIME_METRICS_PATH=/api/runtime/metrics
ENV RUNTIME_POLL_INTERVAL_MS=3000

EXPOSE 8080

USER fastgpt
CMD ["node", "server.mjs"]
