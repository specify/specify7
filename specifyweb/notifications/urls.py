from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^messages/$', views.get_messages),
    url(r'^mark_read/$', views.mark_read),
]
