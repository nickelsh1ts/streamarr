FROM node:20-alpine AS base

# Setup env variabless for yarn and nextjs
# https://nextjs.org/telemetry
ENV NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production YARN_VERSION=4.1.1

# update dependencies, add libc6-compat and dumb-init to the base image
RUN apk update && apk upgrade && apk add --no-cache libc6-compat && apk add dumb-init

RUN corepack enable && corepack prepare yarn@${YARN_VERSION}

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install dependencies only when needed
FROM base AS builder

WORKDIR /app

COPY package.json yarn.lock* ./

RUN echo 'nodeLinker: "node-modules"' > ./.yarnrc.yml
RUN yarn --immutable --network-timeout 1000000

ENV NEXT_PRIVATE_STANDALONE true

COPY src ./src
COPY public ./public
COPY next.config.mjs tsconfig.json tailwind.config.ts postcss.config.js ./

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN yarn build

FROM mcr.microsoft.com/dotnet/sdk:8.0 as aspnet-builder

COPY ./backend /backend
WORKDIR /backend

RUN dotnet restore && \
    dotnet publish PlexSSO.sln -c Release -o build /p:CopyOutputSymbolsToPublishDirectory=false && \
    rm build/ui/index.html

COPY --from=builder /app/public /backend/build/ui/public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone /backend/build/ui
COPY --from=builder --chown=nextjs:nodejs /app/.next/static /backend/build/ui/.next/static

# Production image, copy all the files and run next
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

WORKDIR /app

COPY --from=aspnet-builder /backend/build /app

RUN mkdir -p /config && \
    chmod 777 /config

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

USER nextjs

ENTRYPOINT ["dotnet", "PlexSSO.dll", "--config", "/config/"]

EXPOSE 3000

VOLUME [ "/config" ]

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD [ "dotnet", "PlexSSO.dll", "--healthcheck" ]

