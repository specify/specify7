from django.conf.urls import include, url

from . import views

urlpatterns = [
    url(r'^uniqueness_rules/(?P<discipline_id>\d+)/$', views.uniqueness_rule),
    url(r'^uniqueness_rules/validate/$', views.validate_uniqueness),
]
