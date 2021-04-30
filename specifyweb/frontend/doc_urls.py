from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^api/tables/$', views.api_tables),
    url(r'^api/operations/$', views.api_operations),
    url(r'^api/operations_all/all/$', views.api_operations_all),
]
