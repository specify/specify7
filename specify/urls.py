from django.conf.urls.defaults import patterns
from django.views.generic import TemplateView

urlpatterns = patterns('specify.views',
    (r'^view/(?P<view>[^//]+)/(?P<id>\d+)/$', TemplateView.as_view(template_name="form.html")), 
)
