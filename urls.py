from django.conf.urls import patterns, include, url
from django.views.generic.base import RedirectView

urlpatterns = patterns(
    '',
    # log in and log out pages
    (r'^accounts/login/$', 'context.views.login'),
    (r'^accounts/logout/$', 'context.views.logout'),

    # just redirect root url to the main specify view
    url(r'^$', RedirectView.as_view(url='/specify/')),

    # This is the main specify view.
    # Every URL beginning with '/specify/' is handled
    # by the frontend. 'frontend.urls' just serves the
    # empty webapp container for all these URLs.
    url(r'^specify/', include('frontend.urls')),

    # the main business data API
    url(r'^api/specify/(?P<model>\w+)/(?P<id>\d+)/$', 'specify.views.resource'),
    url(r'^api/specify/(?P<model>\w+)/$', 'specify.views.collection'),

    # access to various UI and app resources starts here
    url(r'^images/(?P<path>.+)$', 'specify.views.images'),
    url(r'^properties/(?P<name>.+).properties$', 'specify.views.properties'),

    url(r'^express_search/', include('express_search.urls')),
    url(r'^context/', include('context.urls')),
    url(r'^testcontext/', include('context.testurls')),
    url(r'^stored_query/', include('stored_queries.urls')),
)
