from django.conf.urls import patterns, include, url

urlpatterns = patterns('specifyweb.stored_queries.views',
    url(r'^query/(?P<id>\d+)/$', 'query'),
    url(r'^ephemeral/$', 'ephemeral'),
    url(r'^make_recordset/$', 'make_recordset'),
)
