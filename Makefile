SHELL := /bin/bash

FRONTEND_PORT ?= 5173
BACKEND_PORT ?= 8787
FRONTEND_ORIGIN ?= http://localhost:$(FRONTEND_PORT)
API_BASE_URL ?= http://localhost:$(BACKEND_PORT)

.PHONY: dev api frontend typecheck test

dev:
	API_PORT=$(BACKEND_PORT) API_ALLOWED_ORIGIN=$(FRONTEND_ORIGIN) VITE_API_BASE_URL=$(API_BASE_URL) npx concurrently --kill-others-on-fail --names api,web --prefix-colors blue,green "npm run api:dev" "npm run dev -- --host localhost --port $(FRONTEND_PORT)"

api:
	API_PORT=$(BACKEND_PORT) API_ALLOWED_ORIGIN=$(FRONTEND_ORIGIN) npm run api:dev

frontend:
	VITE_API_BASE_URL=$(API_BASE_URL) npm run dev -- --host localhost --port $(FRONTEND_PORT)

typecheck:
	npm run typecheck
	npm run typecheck:api

test:
	npm run test
