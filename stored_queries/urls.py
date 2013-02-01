from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns('stored_queries.views',
    url(r'^query/(?P<id>\d+)/$', 'query'),
)
