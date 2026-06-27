FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY web/package.json ./web/
RUN pnpm install --filter web --frozen-lockfile

FROM base AS runner
ENV NODE_ENV=development
WORKDIR /app/web
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/web/node_modules ./node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml /app/
COPY web ./
EXPOSE 3001
CMD ["pnpm", "dev", "-H", "0.0.0.0"]
