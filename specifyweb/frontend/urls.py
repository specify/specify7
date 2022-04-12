"""
Just provide a URL that serves the HTML container for the front end
"""

from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'', views.specify),
]
