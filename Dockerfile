FROM node:24-alpine AS base

ENV NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production YARN_VERSION=4.4.0

RUN apk update && apk upgrade && apk add --no-cache libc6-compat tzdata tini && rm -rf /tmp/*

RUN corepack enable && corepack prepare yarn@${YARN_VERSION}

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

FROM base AS builder

WORKDIR /app

COPY package.json yarn.lock* .env.local ./

RUN echo 'nodeLinker: "node-modules"' > ./.yarnrc.yml
RUN yarn --immutable --network-timeout 1000000

ENV NEXT_PRIVATE_STANDALONE=true

COPY src ./src
COPY public ./public
COPY next.config.mjs tsconfig.json tailwind.config.ts postcss.config.js ./

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

ARG COMMIT_TAG
ENV COMMIT_TAG=${COMMIT_TAG}

RUN yarn build

RUN echo "{\"commitTag\": \"${COMMIT_TAG}\"}" > committag.json

FROM base AS runner

WORKDIR /app

COPY --from=builder /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/.env ./.env

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

USER nextjs

EXPOSE 3000
ENV PORT=3000

ENTRYPOINT [ "/sbin/tini", "--" ]

CMD ["node", "server.js"]
