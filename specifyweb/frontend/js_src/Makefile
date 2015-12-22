BROWSERIFY_OPTIONS= -d -t jstify -t [ babelify --presets [ es2015 ] ]

.PHONY: clean watch

all: ../static/js/bundle.js

../static/js/bundle.js: lib/*.js
	browserify ${BROWSERIFY_OPTIONS} lib/main.js -o $@

watch:
	watchify -v ${BROWSERIFY_OPTIONS} lib/main.js -o ../static/js/bundle.js

clean:
	rm ../static/js/bundle.js
