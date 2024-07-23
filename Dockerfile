FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production

COPY ["package.json", "pnpm-lock.yaml", "./"]
COPY ["tsconfig.json", "./"]
COPY ["src", "./src"]
COPY ["src/startup.sh", "./"]

RUN apt update \
	&& apt install -y git git-lfs wget \
	&& apt-get clean \
	&& rm -rf /var/lib/apt/lists/*
RUN corepack enable
RUN pnpm install --frozen-lockfile

CMD ["/startup.sh"]
