# --------------------------------------
# 1. Stage: Dependencias
# --------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat

# Copia solo los archivos necesarios para instalar dependencias
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# Instalación inteligente según lockfile
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else npm install; \
  fi


# --------------------------------------
# 2. Stage: Builder
# --------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build


# --------------------------------------
# 3. Stage: Runner (ultra-liviano)
# --------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crear usuario no root
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# Copiar build standalone
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

USER nextjs

EXPOSE 3021
ENV PORT=3021
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
