.PHONY: dev

out: node_modules
	node_modules/.bin/next build
	node_modules/.bin/next export

dev: node_modules
	node_modules/.bin/ng serve --port $(FRONTEND_PORT)

node_modules: package.json yarn.lock
	yarn && touch node_modules
