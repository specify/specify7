from django.conf.urls import patterns, url

urlpatterns = patterns('specifyweb.workbench.views',
    url(r'^rows/(?P<wb_id>\d+)/', 'rows'),
    url(r'^upload/(?P<wb_id>\d+)/', 'upload'),
    url(r'^upload_status/(?P<upload_id>\w+)/', 'upload_status'),
    url(r'^upload_status_list/(?P<wb_id>\d+)/', 'upload_status_list'),
)
