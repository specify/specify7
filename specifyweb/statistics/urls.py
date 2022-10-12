from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^collection/global/$', views.collection_global),
    url(r'^collection/user/(?P<user_id>\d+)/$', views.collection_user),
]
