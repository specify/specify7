from django.conf.urls.defaults import patterns, include, url
from django.views.generic import TemplateView
from tastypie.api import Api
import specify.api
#import specify.postapi

# Uncomment the next two lines to enable the admin:
#from django.contrib import admin
#admin.autodiscover()

# Generate the tastypie specify resources urls
api = Api(api_name='specify')
for r in specify.api.resources: api.register(r())

#post_api = Api(api_name='specify')
#for r in specify.postapi.resources: post_api.register(r())

urlpatterns = patterns(
    '',
    (r'^accounts/login/$', 'django.contrib.auth.views.login', {'template_name': 'login.html'}),
    (r'^accounts/logout/$', 'django.contrib.auth.views.logout', {'template_name': 'logged_out.html'}),
    # Examples:
    url(r'^$', TemplateView.as_view(template_name="index.html")),
    url(r'^specify/', include('specify.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    #url(r'^admin/', include(admin.site.urls)),
    #(r'^admin/lookups/', include(ajax_select_urls)),
    #(r'^admin/', include(admin.site.urls)),

    # Tastypie specify urls
    (r'^api/', include(api.urls)),
#    (r'^api/new/', include(post_api.urls)),
)
