from django.conf.urls.defaults import patterns, include, url
from django.views.generic.simple import redirect_to

urlpatterns = patterns(
    '',
    (r'^accounts/login/$', 'context.views.login'),
    (r'^accounts/logout/$', 'context.views.logout'),

    url(r'^$', redirect_to, {'url': '/specify/'}),

    url(r'^specify/', include('frontend.urls')),
    url(r'^images/(?P<path>.+)$', 'specify.views.images'),
    url(r'^properties/(?P<name>.+).properties$', 'specify.views.properties'),

    url(r'^api/specify/(?P<model>\w+)/(?P<id>\d+)/$', 'specify.views.resource'),
    url(r'^api/specify/(?P<model>\w+)/$', 'specify.views.collection'),


    url(r'^express_search/', include('express_search.urls')),
    url(r'^context/', include('context.urls')),
    url(r'^testcontext/', include('context.testurls')),
)
