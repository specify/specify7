from django.conf.urls import patterns

urlpatterns = patterns(
    'specifyweb.context.testsviews',
    (r'^collection/$', 'collection'),
    (r'^domain.json$', 'domain'),
    (r'^viewsets/(?P<level>\d+).xml$', 'viewsets'),
    (r'^schema_localization.json$', 'schema_localization'),
    (r'^app.resource$', 'app_resource'),
    (r'^available_related_searches.json$', 'available_related_searches'),
)
