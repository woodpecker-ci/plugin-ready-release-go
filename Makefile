.PHONY: all
all: test format

.PHONY: clean
clean:
	rm -rf node_modules

.PHONY: test-format
test-format:
	pnpm format:check

.PHONY: test-type
test-type:
	pnpm typecheck

.PHONY: test-unit
test-unit:
	pnpm test

.PHONY: test
test:
	pnpm format:check && pnpm typecheck && pnpm test

.PHONY: format
format:
	prettier -w .
