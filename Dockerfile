FROM node:18-alpine

ENV NODE_ENV=production

WORKDIR /app

RUN apk add git wget

RUN corepack enable

COPY ["package.json", "pnpm-lock.yaml", "./"]

RUN pnpm install --frozen-lockfile

CMD /app/node_modules/.bin/tsx /app/src/index.ts

COPY ["tsconfig.json", "./"]
COPY ["src", "./src"]
