# Entrypoint for the routing of the app

from django.urls import include, path, re_path

from specifyweb.backend.series import views

urlpatterns = [
    # retrieve auto numbered fields
    re_path(r'^series_autonumber_range', views.series_autonumber_range),
]
