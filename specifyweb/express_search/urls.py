from django.conf.urls import patterns, include, url

urlpatterns = patterns(
    'specifyweb.express_search.views',
    url(r'^$', 'search'),
    url(r'^related/$', 'related_search'),
    url(r'^querycbx/(?P<modelname>\w*)/$', 'querycbx_search'),
)


