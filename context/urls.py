from django.conf.urls.defaults import patterns
from django.contrib.auth.decorators import login_required

urlpatterns = patterns(
    'context.views',
    (r'^collection/$', 'collection'),
    (r'^viewsets/(?P<level>\d+).xml$', 'viewsets'),
    (r'^schema_localization.json$', 'schema_localization'),
    (r'^express_search_config.xml$', 'express_search_config'),
)
