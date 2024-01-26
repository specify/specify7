from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^run/$', views.run),
    url(r'^get_reports/$', views.get_reports_view),
    url(r'^get_reports_by_tbl/(?P<table_id>\d+)/$', views.get_reports_by_table),
    url(r'^create/$', views.create),
]

