.PHONY: build clean watch

build:
	npm install && npm audit fix && npm audit
	npx bower install --allow-root
	npx webpack
clean:
	rm -rf bower_components node_modules
	rm -rf ../static/js

watch:
	npx webpack -w --devtool eval --display-chunks --display-modules
