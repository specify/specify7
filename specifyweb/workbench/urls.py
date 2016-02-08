from django.conf.urls import patterns, url

urlpatterns = patterns('specifyweb.workbench.views',
    url(r'^rows/(?P<wb_id>\d+)/', 'rows'),
    url(r'^upload/(?P<wb_id>\d+)/', 'upload', {'no_commit': False}),
    url(r'^validate/(?P<wb_id>\d+)/', 'upload', {'no_commit': True}),
    url(r'^upload_status/(?P<wb_id>.+)/', 'upload_status'),
    url(r'^upload_log/(?P<upload_id>.+)/', 'upload_log'),
)
