.PHONY: build clean watch

build:
	npm ci
	npx webpack -o ../static/js --mode=production

profile: 
	npx webpack --mode=production --profile --json > stats.json
	npx webpack-bundle-analyzer stats.json

clean:
	rm -rf node_modules
	rm -rf ../static/js

watch:
	npx webpack -w --mode development -o ../static/js
