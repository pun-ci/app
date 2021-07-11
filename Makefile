.PHONY:
	init_dev
	dev
	default
	dev_db
	sh

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
	yarn run check-node-version
	node_modules/.bin/concurrently \
		-n reverse-proxy,db,frontend,auth,api \
		-c bgYellow,bgBlue,bgCyan,bgMagenta,bgGreen \
		"(cd dev/reverse-proxy ; make start) 2>&1 | tee -a logs/reverse-proxy.log" \
		"make dev_db 2>&1 > logs/db.log" \
		"(cd frontend ; make dev) 2>&1 | tee -a logs/frontend.log" \
		"(cd auth ; make dev) 2>&1 | tee -a logs/auth.log" \
		"(cd api ; make dev) 2>&1 | tee -a logs/api.log"

dev_db:
	docker run --rm \
		-v punci-eventstore-data:/var/lib/eventstore \
		-v punci-eventstore-logs:/var/log/eventstore \
		-p 1113:1113 \
		-p 2113:2113 \
		-e EVENTSTORE_CLUSTER_SIZE=1 \
		-e EVENTSTORE_RUN_PROJECTIONS=All \
		-e EVENTSTORE_START_STANDARD_PROJECTIONS=true \
		-e EVENTSTORE_EXT_TCP_PORT=1113 \
		-e EVENTSTORE_EXT_HTTP_PORT=2113 \
		-e EVENTSTORE_INSECURE=true \
		-e EVENTSTORE_ENABLE_EXTERNAL_TCP=true \
		-e EVENTSTORE_ENABLE_ATOM_PUB_OVER_HTTP=true \
		eventstore/eventstore:21.2.0-buster-slim

sh:
	sh
