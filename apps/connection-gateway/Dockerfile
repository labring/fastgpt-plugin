# syntax=docker/dockerfile:1.7

# --------- build base -----------
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
COPY apps/connection-gateway/package.json apps/connection-gateway/package.json
COPY packages/domain/package.json packages/domain/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/usecase/package.json packages/usecase/package.json
COPY packages/interface-adapter/package.json packages/interface-adapter/package.json
COPY packages/infrastructure/package.json packages/infrastructure/package.json
COPY sdk/client/package.json sdk/client/package.json
COPY sdk/factory/package.json sdk/factory/package.json

RUN --mount=type=cache,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile --ignore-scripts \
      --filter @fastgpt-plugin/connection-gateway...

# --------- builder -----------
FROM deps AS builder

COPY . .

RUN pnpm --filter @fastgpt-plugin/connection-gateway build

# --------- production dependencies -----------
FROM --platform=$TARGETPLATFORM node:22-alpine AS prod-deps
WORKDIR /app

ENV CI=true
ENV HUSKY=0
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY apps/connection-gateway/package.json apps/connection-gateway/package.json
COPY packages/domain/package.json packages/domain/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/usecase/package.json packages/usecase/package.json
COPY packages/interface-adapter/package.json packages/interface-adapter/package.json
COPY packages/infrastructure/package.json packages/infrastructure/package.json
COPY sdk/client/package.json sdk/client/package.json
COPY sdk/factory/package.json sdk/factory/package.json

RUN --mount=type=cache,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile --prod --ignore-scripts \
      --filter @fastgpt-plugin/connection-gateway...

# --------- runner -----------
FROM --platform=$TARGETPLATFORM node:22-alpine AS runner
WORKDIR /app/apps/connection-gateway

RUN apk add --no-cache \
    curl ca-certificates \
    && update-ca-certificates \
    && addgroup -S fastgpt \
    && adduser -S -G fastgpt fastgpt

COPY --from=prod-deps --chown=fastgpt:fastgpt /app/node_modules /app/node_modules
COPY --from=prod-deps --chown=fastgpt:fastgpt /app/apps/connection-gateway/node_modules ./node_modules
COPY --from=prod-deps --chown=fastgpt:fastgpt /app/apps/connection-gateway/package.json ./package.json
COPY --from=builder --chown=fastgpt:fastgpt /app/apps/connection-gateway/dist ./dist

ENV NODE_ENV=production
ENV CONNECTION_GATEWAY_PORT=3010
ENV CONNECTION_GATEWAY_TCP_PORT=3011

EXPOSE 3010 3011

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -fsS "http://127.0.0.1:${CONNECTION_GATEWAY_PORT}/health" >/dev/null || exit 1

USER fastgpt
CMD ["node", "dist/main.mjs"]
