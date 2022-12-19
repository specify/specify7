.PHONY: build clean watch

build:
	npm ci
	npx webpack -o ../static/js --mode=production
clean:
	rm -rf node_modules
	rm -rf ../static/js

watch:
	npx webpack -w --mode development -o ../static/js
