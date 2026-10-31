ARG BASE_IMAGE=node:26-slim

FROM --platform=$BUILDPLATFORM ${BASE_IMAGE} AS build
WORKDIR /app
ENV NODE_ENV=production

COPY ["package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml", "./"]

# Node 25+ no longer ships corepack, so install the pnpm version pinned in package.json
# hadolint ignore=DL3016
RUN npm i -g "$(node -p 'require("./package.json").packageManager')" \
  && pnpm install --frozen-lockfile --package-import-method copy

FROM ${BASE_IMAGE}
WORKDIR /app
ENV NODE_ENV=production

RUN apt update \
  && apt install -y git git-lfs wget \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build "/app/node_modules" "./node_modules"
COPY "tsconfig.json" "./tsconfig.json"
COPY "src" "./src"

CMD ["/app/node_modules/.bin/tsx", "/app/src/run.ts"]
