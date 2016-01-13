.PHONY: build clean

build:
	npm install
	node_modules/.bin/bower install
	node_modules/.bin/webpack
	rm -rf ../static/css
	cp -r css ../static/
clean:
	rm -rf bower_components node_modules
	rm -f ../static/js/*.js
	rm -rf ../static/css
