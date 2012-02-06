from django.conf.urls.defaults import patterns, include, url
from ajax_select import urls as ajax_select_urls

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'djangospecify.views.home', name='home'),
    url(r'^specify/', include('djangospecify.specify.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),
    (r'^admin/lookups/', include(ajax_select_urls)),
    (r'^admin/', include(admin.site.urls)),
)
