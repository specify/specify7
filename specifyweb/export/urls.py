from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^make_dwca/$', views.export),
]
