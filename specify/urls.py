from django.conf.urls.defaults import patterns
from django.views.generic import TemplateView
from django.contrib.auth.decorators import login_required

urlpatterns = patterns(
    'specify.views',
    (r'^view/(?P<view>[^//]+)/(?P<id>\d+)/$',
     login_required(TemplateView.as_view(template_name="form.html"))),
    (r'^view/(?P<view>[^//]+)/(?P<id>\d+)/new/(?P<model>\w+)/$',
     login_required(TemplateView.as_view(template_name="new_related_object.html"))),
)
