SHELL := /bin/bash

ifneq (,$(wildcard .env))
include .env
export
endif

FRONTEND_PORT ?= 5175
BACKEND_PORT ?= 8787
FRONTEND_ORIGIN ?= http://localhost:$(FRONTEND_PORT)
IMPORT_WORKBOOKS ?= "tmp/Inventory tracking 2026.xlsx" "tmp/2nd hand sales accounting.xlsx"
IMPORT_CHANGED ?= update
IMPORT_ORG_ARG ?=
ADMIN_EMAILS ?= giorgio@3i7.net
FIREBASE_PROJECT ?= $(or $(FIREBASE_PROJECT_ID),$(VITE_FIREBASE_PROJECT_ID))
FIREBASE_CLI ?= npx firebase-tools
FIREBASE_AUTH_ENV := GOOGLE_APPLICATION_CREDENTIALS="$(FIREBASE_SERVICE_ACCOUNT_PATH)"
GCLOUD_AUTH_ENV := CLOUDSDK_AUTH_CREDENTIAL_FILE_OVERRIDE="$(FIREBASE_SERVICE_ACCOUNT_PATH)" GOOGLE_APPLICATION_CREDENTIALS="$(FIREBASE_SERVICE_ACCOUNT_PATH)"
CLOUD_RUN_SERVICE ?= thriftops-api
CLOUD_RUN_REGION ?= us-central1
CLOUD_RUN_DATABASE_URL_SECRET ?= thriftops-database-url:latest

.PHONY: dev api frontend typecheck test import-dry-run import-spreadsheets cloud-run-check cloud-run-deploy firebase-check firebase-deploy firebase-deploy-hosting firebase-deploy-firestore firebase-deploy-storage firebase-emulators

dev:
	API_PORT=$(BACKEND_PORT) API_ALLOWED_ORIGIN=$(FRONTEND_ORIGIN) npx concurrently --kill-others-on-fail --names api,web --prefix-colors blue,green "npm run api:dev" "npm run dev -- --host localhost --port $(FRONTEND_PORT)"

api:
	API_PORT=$(BACKEND_PORT) API_ALLOWED_ORIGIN=$(FRONTEND_ORIGIN) npm run api:dev

frontend:
	BACKEND_PORT=$(BACKEND_PORT) npm run dev -- --host localhost --port $(FRONTEND_PORT)

typecheck:
	npm run typecheck
	npm run typecheck:api

test:
	npm run test

import-dry-run:
	npm run import:spreadsheets -- --dry-run --changed=$(IMPORT_CHANGED) $(IMPORT_ORG_ARG) $(IMPORT_WORKBOOKS)

import-spreadsheets:
	npm run import:spreadsheets -- --apply --changed=$(IMPORT_CHANGED) $(IMPORT_ORG_ARG) $(IMPORT_WORKBOOKS)

cloud-run-check:
	@test -n "$(FIREBASE_PROJECT)" || (echo "FIREBASE_PROJECT_ID or VITE_FIREBASE_PROJECT_ID is required in .env" && exit 1)
	@test -n "$(CLOUD_RUN_REGION)" || (echo "CLOUD_RUN_REGION is required" && exit 1)
	@test -n "$(CLOUD_RUN_SERVICE)" || (echo "CLOUD_RUN_SERVICE is required" && exit 1)
	@test -n "$(CLOUD_RUN_DATABASE_URL_SECRET)" || (echo "CLOUD_RUN_DATABASE_URL_SECRET is required" && exit 1)
	@test -n "$(API_ALLOWED_ORIGIN)" || (echo "API_ALLOWED_ORIGIN is required" && exit 1)
	@test -n "$(FIREBASE_SERVICE_ACCOUNT_PATH)" || (echo "FIREBASE_SERVICE_ACCOUNT_PATH is required in .env" && exit 1)
	@test -f "$(FIREBASE_SERVICE_ACCOUNT_PATH)" || (echo "Firebase service account file not found: $(FIREBASE_SERVICE_ACCOUNT_PATH)" && exit 1)

cloud-run-deploy: cloud-run-check
	$(GCLOUD_AUTH_ENV) gcloud run deploy "$(CLOUD_RUN_SERVICE)" \
		--project "$(FIREBASE_PROJECT)" \
		--region "$(CLOUD_RUN_REGION)" \
		--source . \
		--allow-unauthenticated \
		--set-env-vars "^|^FIREBASE_PROJECT_ID=$(FIREBASE_PROJECT)|ADMIN_EMAILS=$(ADMIN_EMAILS)|API_ALLOWED_ORIGIN=$(API_ALLOWED_ORIGIN)" \
		--set-secrets "DATABASE_URL=$(CLOUD_RUN_DATABASE_URL_SECRET)"

firebase-check:
	@test -n "$(FIREBASE_PROJECT)" || (echo "FIREBASE_PROJECT_ID or VITE_FIREBASE_PROJECT_ID is required in .env" && exit 1)
	@test -n "$(FIREBASE_SERVICE_ACCOUNT_PATH)" || (echo "FIREBASE_SERVICE_ACCOUNT_PATH is required in .env" && exit 1)
	@test -f "$(FIREBASE_SERVICE_ACCOUNT_PATH)" || (echo "Firebase service account file not found: $(FIREBASE_SERVICE_ACCOUNT_PATH)" && exit 1)

firebase-deploy: firebase-check
	npm run build
	$(FIREBASE_AUTH_ENV) $(FIREBASE_CLI) deploy --project "$(FIREBASE_PROJECT)" --only hosting,firestore,storage

firebase-deploy-hosting: firebase-check
	npm run build
	$(FIREBASE_AUTH_ENV) $(FIREBASE_CLI) deploy --project "$(FIREBASE_PROJECT)" --only hosting

firebase-deploy-firestore: firebase-check
	$(FIREBASE_AUTH_ENV) $(FIREBASE_CLI) deploy --project "$(FIREBASE_PROJECT)" --only firestore

firebase-deploy-storage: firebase-check
	$(FIREBASE_AUTH_ENV) $(FIREBASE_CLI) deploy --project "$(FIREBASE_PROJECT)" --only storage

firebase-emulators:
	$(FIREBASE_AUTH_ENV) $(FIREBASE_CLI) emulators:start --project "$(FIREBASE_PROJECT)"
