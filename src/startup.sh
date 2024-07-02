#!/usr/bin/env sh

set -e
set -x
set -o pipefail

/app/node_modules/.bin/tsx /app/src/run.ts
