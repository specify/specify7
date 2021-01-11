.PHONY: build clean watch

build:
	npm install
	npx webpack
clean:
	rm -rf node_modules
	rm -rf ../static/js

watch:
	npx webpack -w --mode development
