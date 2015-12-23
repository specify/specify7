.PHONY: clean watch

all: ../static/js/*.js

../static/js/*.js: lib/*.js
	webpack

watch:
	webpack -w

clean:
	rm ../static/js/*.js
