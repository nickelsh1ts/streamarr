FROM node:24-alpine AS base

ENV NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production YARN_VERSION=4.9.2

RUN apk update && apk upgrade && apk add --no-cache libc6-compat tzdata tini python3 py3-pip && rm -rf /tmp/*

RUN corepack enable && corepack prepare yarn@${YARN_VERSION}

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

FROM base AS builder

WORKDIR /app

COPY package.json yarn.lock* ./
COPY example.env ./.env

RUN echo 'nodeLinker: "node-modules"' > ./.yarnrc.yml
RUN yarn --immutable --network-timeout 1000000

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

RUN yarn build

RUN yarn cache clean && rm -rf /root/.cache /app/.yarn /app/src /app/server/**/*.ts /app/server/**/*.tsx /app/server/**/*.map

ARG COMMIT_TAG
RUN echo "{\"commitTag\": \"${COMMIT_TAG}\"}" > committag.json

FROM base AS runner

WORKDIR /app

COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/yarn.lock* ./
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/next.config.mjs ./next.config.mjs
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=nextjs:nodejs /app/tailwind.config.ts ./tailwind.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/postcss.config.js ./postcss.config.js
COPY --from=builder --chown=nextjs:nodejs /app/streamarr-api.yml ./streamarr-api.yml
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/venv ./venv
COPY --from=builder --chown=nextjs:nodejs /app/committag.json ./committag.json
COPY --from=builder --chown=nextjs:nodejs /app/.yarnrc.yml ./
COPY --from=builder --chown=nextjs:nodejs /app/server/python ./python

RUN mkdir -p /app/config && chown -R nextjs:nodejs /app/config
RUN mkdir -p /app/.yarn && chown -R nextjs:nodejs /app/.yarn

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

USER nextjs

EXPOSE 3000 5005
ENV PORT=3000

ENTRYPOINT [ "/sbin/tini", "--" ]

CMD ["/bin/sh", "-c", "./venv/bin/gunicorn -w 2 -b 0.0.0.0:5005 python.plex_invite:app & yarn start"]
