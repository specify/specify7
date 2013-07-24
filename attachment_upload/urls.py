from django.conf.urls import patterns

urlpatterns = patterns(
    'attachment_upload.views',
    (r'^get_upload_params/$', 'get_upload_params'),
)
