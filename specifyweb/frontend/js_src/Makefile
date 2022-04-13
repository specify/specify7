.PHONY: build clean watch

build:
	npm install
	npx webpack -o ../static/js --mode=production
clean:
	rm -rf node_modules
	rm -rf ../static/js
	rm -rf testBuild

watch:
	npx webpack -w --mode development -o ../static/js
