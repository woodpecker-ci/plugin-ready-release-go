FROM node:18-alpine@sha256:435dcad253bb5b7f347ebc69c8cc52de7c912eb7241098b920f2fc2d7843183d

ENV NODE_ENV=production

WORKDIR /app

RUN apk add git wget

RUN corepack enable

COPY ["package.json", "pnpm-lock.yaml", "./"]

RUN pnpm install --frozen-lockfile

CMD /app/node_modules/.bin/tsx /app/src/index.ts

COPY ["tsconfig.json", "./"]
COPY ["src", "./src"]

ENV DEBUG=simple-git
