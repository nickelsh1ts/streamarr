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
    pip install --no-cache-dir -r server/python/requirements.txt; \
fi

RUN yarn build

ARG COMMIT_TAG
RUN echo "{\"commitTag\": \"${COMMIT_TAG}\"}" > committag.json

FROM base AS runner

WORKDIR /app

COPY --from=builder --chown=nextjs:nodejs /app ./
RUN mkdir -p /app/config && chown -R nextjs:nodejs /app/config

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

USER nextjs

EXPOSE 3000 5005
ENV PORT=3000

ENTRYPOINT [ "/sbin/tini", "--" ]

CMD ["/bin/sh", "-c", "./venv/bin/gunicorn -w 2 -b 0.0.0.0:5005 server.python.plex_invite:app & yarn start"]
