SHELL:=/bin/bash

# Recipes that wrap npm run scripts for use in the workflows.

.PHONY: bump_major
bump_major:
	npm version major
	npm i --package-lock-only

.PHONY: bump_minor
bump_minor:
	npm version minor
	npm i --package-lock-only

.PHONY: bump_patch
bump_patch:
	npm version patch
	npm i --package-lock-only

.PHONY: setup
setup:
	sudo apt install xvfb
	npm list -g --depth 0
	npm ci --legacy-peer-deps
	npm list

.PHONY: update
update:
	npm outdated
	npm install

.PHONY: clean
clean:
	rm -f skenvy-pretty-ts-errors-*.tgz
	npm run clean

.PHONY: test
test: clean
	npx xvfb-maybe npm test
	npm publish --dry-run

.PHONY: lint
lint:
	TIMING=1 npm run lint

.PHONY: build
build: clean test lint
	npm pack

.PHONY: publish
publish:
	npm publish --access=public skenvy-pretty-ts-errors-*.tgz
