.PHONY: build clean

build:
	npm install
	node_modules/.bin/bower install
	node_modules/.bin/webpack
clean:
	rm -rf bower_components node_modules
	rm -rf ../static/js
