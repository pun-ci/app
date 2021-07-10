.PHONY: dev audit test test_compiled

default: build

dev: node_modules
	node_modules/.bin/nodemon

build: node_modules
	node_modules/.bin/tsc -p . --outDir ./build --pretty

node_modules: package.json yarn.lock
	yarn --immutable && touch node_modules

docker:
	docker build -t lencse/test-lencse-link-main --no-cache --progress plain .

test: node_modules
	node_modules/.bin/jest --verbose

test_compiled: build
	node_modules/.bin/jest -c jest.compiled.config.js --verbose

audit:
	yarn audit

verify: audit test test_compiled
