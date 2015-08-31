from django.conf.urls import patterns, url

urlpatterns = patterns('specifyweb.workbench.views',
    url(r'^rows/(?P<wb_id>\d+)/', 'rows'),
)
