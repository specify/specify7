from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^collection/user/(?P<user_id>\d+)/$', views.collection_user),
    url(r'^collection/holdings/$', views.collection_holdings),
    url(r'^collection/preparations/$', views.collection_preparations),
    url(r'^collection/type_specimens/$', views.collection_type_specimens),
    url(r'^collection/locality_geography/$', views.collection_locality_geography),
    url(r'^node_number_test/$', views.node_number_rework)
]
