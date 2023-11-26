FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY ["package.json", "pnpm-lock.yaml", "./"]
COPY ["tsconfig.json", "./"]
COPY ["src", "./src"]
COPY ["startup.sh", "./"]

RUN apk add -q --no-cache git wget && corepack enable
RUN pnpm install --frozen-lockfile

CMD ["/startup.sh"]
