FROM --platform=$BUILDPLATFORM node:22-slim AS build
WORKDIR /app
ENV NODE_ENV=production

COPY ["package.json", "pnpm-lock.yaml", "./"]

RUN corepack enable
RUN pnpm install --frozen-lockfile --package-import-method copy

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build "/app/node_modules" "./node_modules"
COPY "tsconfig.json" "./tsconfig.json"
COPY "src" "./src"

RUN apt update \
	&& apt install -y git git-lfs wget \
	&& apt-get clean \
	&& rm -rf /var/lib/apt/lists/*

CMD ["/app/node_modules/.bin/tsx", "/app/src/run.ts"]
