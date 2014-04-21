
R_JS = ../../tools/r.js

JS_FILES = $(filter-out static/js/main-built.js,$(wildcard static/js/*.js))
CSS_FILES = $(filter-out static/css/main-built.css,$(wildcard static/css/*.css))

all: templates/specify-built.html

clean:
	rm templates/specify-built.html static/js/main-built.js static/css/main-built.css

templates/specify-built.html: templates/specify.html static/js/main-built.js static/css/main-built.css
	sed 's:main.css:main-built.css:;s: data-main="/static/js/main.js"::;s:/static/js/vendor/require.js:/static/js/main-built.js:' \
		templates/specify.html > $@

static/js/main-built.js: ${JS_FILES}
	node ${R_JS} -o static/js/app.build.js out=$@

static/css/main-built.css: ${CSS_FILES}
	node ${R_JS} -o cssIn=static/css/main.css out=$@
