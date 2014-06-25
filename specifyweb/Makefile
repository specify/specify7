SUBDIRS = frontend

build_version.py: subdirs
	echo "VERSION = '`git describe`'" > $@


.PHONY: clean subdirs $(SUBDIRS)

subdirs: $(SUBDIRS)

$(SUBDIRS):
	$(MAKE) -C $@

clean:
	rm -f build_version.py
	for d in $(SUBDIRS); do $(MAKE) -C $$d clean; done
