from django.conf.urls import patterns, include, url

urlpatterns = patterns('stored_queries.views',
    url(r'^query/(?P<id>\d+)/$', 'query'),
)
