.PHONY: dev

dev: node_modules
	node_modules/.bin/next dev -p $(FRONTEND_PORT)

node_modules: package.json yarn.lock
	yarn && touch node_modules
