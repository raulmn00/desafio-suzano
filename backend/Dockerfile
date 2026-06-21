# Build a partir da RAIZ do monorepo (context: .) para acessar o lockfile do workspace.
# Multi-stage: builder compila TS + gera Prisma Client; runner roda a API.
FROM node:26-slim AS builder
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY backend/package.json ./backend/
RUN pnpm install --frozen-lockfile

COPY backend ./backend
WORKDIR /app/backend
RUN pnpm prisma generate && pnpm build

FROM node:26-slim AS runner
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app/backend
ENV NODE_ENV=production
ENV PORT=8080

COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/prisma ./prisma
COPY --from=builder /app/backend/package.json ./

EXPOSE 8080
# Aplica migrations e sobe a API (servidor HTTP de longa duração).
CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/main.js"]
