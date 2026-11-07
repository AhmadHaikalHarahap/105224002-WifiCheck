# Stage 1: Dependencies
FROM node:24-alpine AS deps

WORKDIR /app

RUN apk update && apk upgrade --no-cache && apk add --no-cache openssl

COPY package.json package-lock.json ./
RUN npm ci


# Stage 2: Build aplikasi
FROM node:24-alpine AS builder

WORKDIR /app

RUN apk update && apk upgrade --no-cache && apk add --no-cache openssl

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"

RUN ENCRYPTION_KEY="$(printf '%064d' 0)" npx prisma generate
RUN ENCRYPTION_KEY="$(printf '%064d' 0)" npm run build


# Stage 3: Production
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Perbarui paket sistem dari repository stable Alpine v3.24
# dan bersihkan package manager build-time (npm, corepack, yarn, cache)
# yang tidak diperlukan di runtime produksi
RUN apk update && apk upgrade --no-cache \
    && rm -rf /usr/local/lib/node_modules/npm \
              /usr/local/lib/node_modules/corepack \
              /usr/local/bin/npm \
              /usr/local/bin/npx \
              /usr/local/bin/corepack \
              /usr/local/bin/yarn \
              /usr/local/bin/yarnpkg \
              /opt/yarn* \
              /root/.npm \
              /root/.cache

RUN addgroup -S -g 1001 nodejs \
    && adduser -S -u 1001 nextjs

RUN mkdir -p public

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
