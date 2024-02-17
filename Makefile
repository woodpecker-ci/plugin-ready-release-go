.PHONY: all
all: build test

.PHONY:
build:
	corepack enable
	pnpm build

.PHONY: test
test:
	pnpm test

.PHONY: clean
clean:
