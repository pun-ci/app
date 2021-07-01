.PHONY: start

start: node_modules
	yarn run main

node_modules: package.json yarn.lock
	yarn && touch node_modules
