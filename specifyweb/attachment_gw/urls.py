from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^get_settings/$', views.get_settings),
    url(r'^get_upload_params/$', views.get_upload_params),
    url(r'^get_token/$', views.get_token),
    url(r'^proxy/$', views.proxy),
    url(r'^download_all/$', views.download_all),
    url(r'^dataset/$', views.datasets),
    url(r'^dataset/(?P<ds_id>\d+)/$', views.dataset),

]
