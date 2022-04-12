"""
Provides urls to access the mocked views
"""

from django.conf.urls import url

from . import testsviews as views

urlpatterns = [
    url(r'^collection/$', views.collection),
    url(r'^domain.json$', views.domain),
    url(r'^viewsets/(?P<level>\d+).xml$', views.viewsets),
    url(r'^schema_localization.json$', views.schema_localization),
    url(r'^app.resource$', views.app_resource),
    url(r'^available_related_searches.json$', views.available_related_searches),
]
