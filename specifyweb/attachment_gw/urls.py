from django.conf.urls import patterns

urlpatterns = patterns(
    'specifyweb.attachment_gw.views',
    (r'^get_settings/$', 'get_settings'),
    (r'^get_upload_params/$', 'get_upload_params'),
    (r'^get_token/$', 'get_token')
)
