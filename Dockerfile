FROM node:26-alpine@sha256:725aeba2364a9b16beae49e180d83bd597dbd0b15c47f1f28875c290bfd255b9 AS base

ENV NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production

RUN apk update && apk upgrade && apk add --no-cache libc6-compat tzdata tini && rm -rf /tmp/* \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

FROM base AS builder

RUN npm install -g corepack --force && corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
  corepack pnpm install --frozen-lockfile --ignore-scripts

RUN pnpm rebuild bcrypt sharp sqlite3

COPY src ./src
COPY public ./public
COPY next.config.mjs tsconfig.json postcss.config.js streamarr-api.yml ./
COPY server ./server

RUN pnpm build \
  && rm -rf /app/.next/cache /app/src

ARG COMMIT_TAG
RUN echo "{\"commitTag\": \"${COMMIT_TAG}\"}" > committag.json

FROM builder AS prod-deps

RUN npm prune --omit=dev 2>/dev/null; \
  pnpm store prune && rm -rf /root/.cache

FROM base AS runner

LABEL org.opencontainers.image.source="https://github.com/nickelsh1ts/streamarr" \
  org.opencontainers.image.title="Streamarr" \
  org.opencontainers.image.description="Plex/Arr service dashboard" \
  org.opencontainers.image.licenses="MIT"

WORKDIR /app

COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs \
  /app/package.json \
  /app/committag.json \
  /app/next.config.mjs \
  /app/streamarr-api.yml \
  ./

RUN mkdir -p /app/config && chown -R nextjs:nodejs /app/config

USER nextjs

EXPOSE 3000 5005
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO /dev/null http://localhost:3000/api/v1/status || exit 1

ENTRYPOINT [ "/sbin/tini", "--" ]

CMD ["node", "dist/index.js"]
