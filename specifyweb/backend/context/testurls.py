"""
Provides urls to access the mocked views
"""

from django.urls import path

from . import testsviews as views

urlpatterns = [
    path('collection/', views.collection),
    path('domain.json', views.domain),
    path('viewsets/<int:level>.xml', views.viewsets),
    path('schema_localization.json', views.schema_localization),
    path('app.resource', views.app_resource),
    path('available_related_searches.json', views.available_related_searches),
]
