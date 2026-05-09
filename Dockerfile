# --------- builder -----------
FROM node:22-alpine AS builder
WORKDIR /app

# 复制源代码
COPY . .

# 安装依赖
RUN corepack enable pnpm
RUN --mount=type=cache,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    for i in $(seq 1 3); do \
    pnpm install --frozen-lockfile && break || \
    sleep 5; \
    done

# 构建
RUN pnpm run build:server

# --------- runner -----------
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache\
    curl ca-certificates\
    && update-ca-certificates\
    && addgroup -S fastgpt\
    && adduser -S -G fastgpt fastgpt

# copy running files
COPY --from=builder --chown=fastgpt:fastgpt /app/apps/server/dist/ ./dist/

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

ENV serverPath=./dist/main.js
USER fastgpt
CMD ["sh", "-c", "case \"${AUTH_TOKEN:-}\" in \"\"|token|changeme|password|secret|default) echo \"AUTH_TOKEN must be set to a strong non-default value before starting\" >&2; exit 1;; esac; if [ ${#AUTH_TOKEN} -lt 32 ]; then echo \"AUTH_TOKEN must be at least 32 characters\" >&2; exit 1; fi; exec node dist/main.js"]
