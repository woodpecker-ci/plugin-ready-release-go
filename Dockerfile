FROM node:21-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY ["package.json", "pnpm-lock.yaml", "./"]
COPY ["tsconfig.json", "./"]
COPY ["src", "./src"]

RUN apk add -q --no-cache git wget && corepack enable
RUN pnpm install --frozen-lockfile

CMD ["/app/node_modules/.bin/tsx", "/app/src/run.ts"]
