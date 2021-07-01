.PHONY:
	init_dev
	dev
	default

ifneq (,$(wildcard ./.env))
    include .env
    export
endif

default:
	cd frontend ; make

.env:
	cp .env.example .env

init_dev: .env

node_modules: package.json yarn.lock
	yarn && touch node_modules

logs:
	mkdir -p logs

dev: logs node_modules
	node_modules/.bin/concurrently \
		-n reverse-proxy,frontend,auth \
		-c bgYellow,bgBlue,bgCyan \
		"(cd dev/reverse-proxy ; make start) 2>&1 | tee -a logs/reverse-proxy.log" \
		"(cd frontend ; make dev) 2>&1 | tee -a logs/frontend.log" \
		"(cd auth ; make dev) 2>&1 | tee -a logs/auth.log"
