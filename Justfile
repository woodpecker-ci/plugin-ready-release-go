test-format:
    pnpm format:check

test-type:
    pnpm typecheck

test-unit:
    pnpm test

test-all:
    pnpm format:check && pnpm typecheck && pnpm test

format:
    prettier -w .
