FROM node:25-alpine@sha256:bdf2cca6fe3dabd014ea60163eca3f0f7015fbd5c7ee1b0e9ccb4ced6eb02ef4 AS base

ENV NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production

RUN apk update && apk upgrade && apk add --no-cache libc6-compat tzdata tini python3 && rm -rf /tmp/* \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

FROM base AS builder

RUN apk add --no-cache py3-pip \
  && npm install -g corepack --force && corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
  corepack pnpm install --frozen-lockfile

COPY src ./src
COPY public ./public
COPY next.config.mjs tsconfig.json tailwind.config.ts postcss.config.js streamarr-api.yml ./
COPY server ./server

RUN if [ -f server/python/requirements.txt ]; then \
  python3 -m venv /app/venv && \
  . /app/venv/bin/activate && \
  pip install --no-cache-dir -r server/python/requirements.txt && \
  pip install --no-cache-dir gunicorn; \
  fi

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
COPY --from=builder --chown=nextjs:nodejs /app/venv ./venv
COPY --from=builder --chown=nextjs:nodejs /app/server/python ./python
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
