from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns('express_search.views',
    url(r'^$', 'search'),
    url(r'^related/$', 'related_search'),
    url(r'^available_related/$', 'available_related_searches'),
)


