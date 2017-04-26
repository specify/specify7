from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^taxon_bar/$', views.taxon_bar),
]
