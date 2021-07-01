.PHONY:
	init_dev
	dev

ifneq (,$(wildcard ./.env))
    include .env
    export
endif

.env:
	cp .env.example .env

init_dev: .env

node_modules: package.json yarn.lock
	yarn && touch node_modules

logs:
	mkdir -p logs

dev: logs node_modules
	`yarn bin`/concurrently \
		-n reverse-proxy,frontend \
		-c bgYellow,bgBlue \
		"(cd dev/reverse-proxy ; make start) 2>&1 | tee -a logs/reverse-proxy.log" \
		"(cd frontend ; make dev) 2>&1 | tee -a logs/frontend.log"
