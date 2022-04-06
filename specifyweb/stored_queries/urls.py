from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^query/(?P<id>\d+)/$', views.query),
    url(r'^ephemeral/$', views.ephemeral),
    url(r'^exportcsv/$', views.export_csv),
    url(r'^exportkml/$', views.export_kml),
    url(r'^make_recordset/$', views.make_recordset),
    url(r'^return_loan_preps/$', views.return_loan_preps),
]
