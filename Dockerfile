FROM node:22-slim

WORKDIR /app

ENV NODE_ENV=production

RUN apt update \
	&& apt install -y git git-lfs wget \
	&& apt-get clean \
	&& rm -rf /var/lib/apt/lists/*
RUN corepack enable

COPY ["package.json", "pnpm-lock.yaml", "./"]
RUN pnpm install --frozen-lockfile

COPY ["tsconfig.json", "./"]
COPY ["src", "./src"]

CMD ["/app/node_modules/.bin/tsx", "/app/src/run.ts"]
