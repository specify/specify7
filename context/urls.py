from django.conf.urls.defaults import patterns
from django.contrib.auth.decorators import login_required

urlpatterns = patterns(
    'context.views',
    (r'^collection/$', 'collection'),
    (r'^viewsets/$', 'viewsets')
    # (r'^view/(?P<model>[^/]+)/(?P<id>\d+)/new/(?P<related_model>\w+)/$',
    #  login_required(TemplateView.as_view(template_name="new_related_object.html"))),
    # (r'^rawview/(?P<nameType>[^/]+)/(?P<name>[^/]+)/$',
    #  login_required(TemplateView.as_view(template_name="rawform.html"))),
)
