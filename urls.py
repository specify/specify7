from django.conf.urls.defaults import patterns, include, url
from django.views.generic import TemplateView
from django.conf import settings


# Uncomment the next two lines to enable the admin:
#from django.contrib import admin
#admin.autodiscover()

urlpatterns = patterns(
    '',
    (r'^accounts/login/$', 'context.views.login'),
    (r'^accounts/logout/$', 'context.views.logout'),
    # Examples:
    url(r'^$', TemplateView.as_view(template_name="index.html")),
    url(r'^overview/$', TemplateView.as_view(template_name="code_overview.html")),
    url(r'^specify/', include('specify.urls')),
    url(r'^context/', include('context.urls')),
    url(r'^images/(?P<path>.+)$', 'specify.views.images'),
    url(r'^properties/(?P<name>.+).properties$', 'specify.views.properties'),
    url(r'^express_search/', include('express_search.urls')),

    url(r'^testcontext/', include('context.testurls')),


    (r'^api/specify/(?P<model>\w+)/(?P<id>\d+)/$', 'specify.api.resource'),
    (r'^api/specify/(?P<model>\w+)/$', 'specify.api.collection'),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    #url(r'^admin/', include(admin.site.urls)),
    #(r'^admin/lookups/', include(ajax_select_urls)),
    #(r'^admin/', include(admin.site.urls)),

    # jpa proxy
    (r'^jpa/(?P<model>.+)$', 'specify.views.jpa_proxy'),
    # (r'^rawview/(?P<nameType>[^/]+)/(?P<name>[^/]+)/$',
)
