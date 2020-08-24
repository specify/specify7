.PHONY: build clean watch

build:
	npm install
	node_modules/.bin/webpack
clean:
	rm -rf node_modules
	rm -rf ../static/js

watch:
	node_modules/.bin/webpack -w --devtool eval --display-chunks --display-modules
