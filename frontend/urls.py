from django.conf.urls.defaults import patterns
from django.views.generic import TemplateView
from django.contrib.auth.decorators import login_required

urlpatterns = patterns(
    '',
    (r'', login_required(TemplateView.as_view(template_name="form.html"))),
)
