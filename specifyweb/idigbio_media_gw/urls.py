from django.conf.urls import patterns

urlpatterns = patterns(
    'specifyweb.idigbio_media_gw.views',
    (r'^get_settings/$', 'get_settings'),
    (r'^upload/$', 'upload'),
)
