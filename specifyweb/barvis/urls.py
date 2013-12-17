from django.conf.urls import patterns, include, url

urlpatterns = patterns('specifyweb.barvis.views',
    url(r'^taxon_bar/$', 'taxon_bar'),
)
