"""
Provides urls to access the mocked views
"""

from django.urls import path, re_path

from . import testsviews as views

urlpatterns = [
    path('collection/', views.collection),
    re_path(r'^domain.json$', views.domain),
    re_path(r'^viewsets/(?P<level>\d+).xml$', views.viewsets),
    re_path(r'^schema_localization.json$', views.schema_localization),
    re_path(r'^app.resource$', views.app_resource),
    re_path(r'^available_related_searches.json$', views.available_related_searches),
]
