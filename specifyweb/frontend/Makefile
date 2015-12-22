
R_JS = ../../tools/r.js

CSS_FILES = $(filter-out static/css/main-built.css,$(wildcard static/css/*.css))

all: js static/bower_components static/css/main-built.css

.PHONY: clean js all

js:
	make -C js_src

static/bower_components: static/bower.json
	cd static && bower install
	touch $@

static/css/main-built.css: ${CSS_FILES}
	node ${R_JS} -o cssIn=static/css/main.css out=$@

clean:
	make -C js_src clean
	rm -rf static/bower_components static/css/main-built.css
