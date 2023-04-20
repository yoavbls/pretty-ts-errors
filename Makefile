.PHONY: bump_major bump_minor bump_patch setup update clean test lint build publish
SHELL:=/bin/bash

bump_major:
	npm version major
	npm i --package-lock-only

bump_minor:
	npm version minor
	npm i --package-lock-only

bump_patch:
	npm version patch
	npm i --package-lock-only

setup:
	npm list -g --depth 0
	npm ci
	npm list

update:
	npm outdated
	npm install

clean:
	rm -f pretty-ts-errors-*.tgz
	npm run clean

test: clean
	npm test
	npm publish --dry-run

lint:
	TIMING=1 npm run lint

build: clean test lint verify_transpiled_checkin
	npm pack

publish:
	npm publish --access=public pretty-ts-errors-*.tgz
