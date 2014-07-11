
R_JS = ../../tools/r.js

JS_FILES = $(filter-out static/js/main-built.js,$(wildcard static/js/*.js))
CSS_FILES = $(filter-out static/css/main-built.css,$(wildcard static/css/*.css))
TEMPLATES = $(wildcard static/html/templates/*)

all: static/js/main-built.js static/css/main-built.css

.PHONY: clean

static/js/main-built.js: ${JS_FILES} ${TEMPLATES}
	node ${R_JS} -o static/js/app.build.js out=$@

static/css/main-built.css: ${CSS_FILES}
	node ${R_JS} -o cssIn=static/css/main.css out=$@

clean:
	rm -f static/js/main-built.js static/css/main-built.css
