ARG DENO_VERSION=2.9.3

FROM denoland/deno:${DENO_VERSION} AS build
WORKDIR /app

COPY ["package.json", "deno.json", "deno.lock", "./"]
COPY src ./src

# Drop devDependencies so only runtime packages are embedded in the binary,
# then let deno resolve and install the remaining npm dependencies.
RUN deno eval 'const p = JSON.parse(Deno.readTextFileSync("package.json")); delete p.devDependencies; Deno.writeTextFileSync("package.json", JSON.stringify(p, null, 2));' \
  && deno install

RUN deno task compile

# A `FROM scratch` or alpine final stage is not possible: deno compile only
# targets glibc (no musl denort exists), the produced binary is dynamically
# linked, the plugin spawns the git CLI via simple-git, user-defined hooks run
# through /bin/sh (shelljs) and the forge API clients need CA certificates.
# bookworm-slim is the smallest base that provides all of that.
FROM debian:bookworm-slim
WORKDIR /app

RUN apt update \
  && apt install -y --no-install-recommends git git-lfs wget ca-certificates \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/ready-release-go /usr/local/bin/ready-release-go

CMD ["/usr/local/bin/ready-release-go"]
