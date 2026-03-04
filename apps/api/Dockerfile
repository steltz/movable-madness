# Stage 1: Builder
FROM node:22-slim AS builder
RUN corepack enable pnpm
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY libs/shared-types/package.json ./libs/shared-types/
COPY . .

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile && \
    pnpm nx build api --prod

# Stage 2: Production
FROM node:22-slim AS runner

ENV NODE_ENV=production
ENV PORT=8080

RUN groupadd -r nodejs && useradd -r -g nodejs nodejs

WORKDIR /app

COPY --from=builder /app/dist/apps/api ./
COPY --from=builder /app/node_modules ./node_modules

USER nodejs
EXPOSE 8080

CMD ["node", "main.js"]
