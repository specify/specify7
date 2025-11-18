from django.urls import include, path, re_path

from specifyweb.backend.locality_update_tool import views

urlpatterns = [
    # locality set import endpoints
    path('localityset/', include([
        path('parse/', views.parse_locality_set),
        path('import/', views.upload_locality_set),
        re_path(r'^status/(?P<taskid>[0-9a-fA-F-]+)/$', views.localityupdate_status),
        re_path(r'^abort/(?P<taskid>[0-9a-fA-F-]+)/$', views.abort_localityupdate_task),
    ])),
]
