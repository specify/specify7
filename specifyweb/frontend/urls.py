"""
Just provide a URL that serves the HTML container for the front end
"""

from django.urls import re_path

from . import views

urlpatterns = [
    re_path(r'', views.specify),
]
