
R_JS = ../../tools/r.js

CSS_FILES = $(filter-out static/css/main-built.css,$(wildcard static/css/*.css))

all: static/bower_components static/css/main-built.css static/js/bundle.js

.PHONY: clean static/js/bundle.js

static/js/bundle.js:
	cd js_src && browserify -t jstify -d lib/main.js -o ../static/js/bundle.js

static/bower_components: static/bower.json
	cd static && bower install
	touch $@

static/css/main-built.css: ${CSS_FILES}
	node ${R_JS} -o cssIn=static/css/main.css out=$@

clean:
	rm -rf static/bower_components static/css/main-built.css
