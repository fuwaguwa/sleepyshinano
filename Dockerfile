FROM oven/bun:1-alpine AS base

FROM base AS deps
WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile --production

FROM base AS builder
WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache \
  fontconfig \
  ttf-dejavu \
  && fc-cache -f -v

RUN addgroup --system --gid 1001 nodejs && \
  adduser --system --uid 1001 shinanouser

COPY --from=builder --chown=shinanouser:nodejs /app/dist ./dist
COPY --from=deps --chown=shinanouser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=shinanouser:nodejs /app/package.json ./package.json
COPY --from=builder --chown=shinanouser:nodejs /app/data ./data

USER shinanouser

CMD ["bun", "run", "prod"]
