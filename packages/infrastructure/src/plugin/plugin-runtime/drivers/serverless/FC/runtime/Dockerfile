# syntax=docker/dockerfile:1.7

# --------- base -----------
FROM node:22-alpine AS base
WORKDIR /app

ENV CI=true
ENV HUSKY=0
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable pnpm

# --------- deps -----------
FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages/domain/package.json packages/domain/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/usecase/package.json packages/usecase/package.json
COPY packages/interface-adapter/package.json packages/interface-adapter/package.json
COPY packages/infrastructure/package.json packages/infrastructure/package.json
COPY sdk/factory/package.json sdk/factory/package.json

RUN --mount=type=cache,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile --ignore-scripts \
      --filter @fastgpt-plugin/infrastructure... \
      --filter @fastgpt-plugin/sdk-factory

# --------- builder -----------
FROM deps AS builder

COPY packages/domain packages/domain
COPY packages/shared packages/shared
COPY packages/usecase packages/usecase
COPY packages/interface-adapter packages/interface-adapter
COPY packages/infrastructure packages/infrastructure
COPY sdk/factory sdk/factory

RUN pnpm --filter @fastgpt-plugin/sdk-factory build && \
    pnpm --filter @fastgpt-plugin/infrastructure build:fc-runtime

# --------- runner -----------
FROM node:22-alpine AS runner
WORKDIR /app

RUN addgroup -S fastgpt && adduser -S -G fastgpt fastgpt

COPY --from=builder --chown=fastgpt:fastgpt \
  /app/packages/infrastructure/src/plugin/plugin-runtime/drivers/serverless/FC/runtime/dist ./dist

ENV NODE_ENV=production
ENV PORT=9000

EXPOSE 9000

USER fastgpt
CMD ["node", "dist/bootstrap.js"]
