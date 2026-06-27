FROM node:22-alpine AS base
RUN apk add --no-cache openssl libc6-compat wget
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/
RUN pnpm install --filter backend --frozen-lockfile

FROM base AS runner
ENV NODE_ENV=development
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend ./backend
WORKDIR /app/backend
RUN pnpm db:generate
EXPOSE 3000
CMD ["pnpm", "dev"]
