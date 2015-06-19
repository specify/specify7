from django.conf.urls import patterns, include, url

urlpatterns = patterns(
    'specifyweb.report_runner.views',
    url(r'^run/$', 'run'),
    url(r'^get_reports/$', 'get_reports'),
    url(r'^get_reports_by_tbl/(?P<tbl_id>\d+)/$', 'get_reports_by_tbl'),
)

