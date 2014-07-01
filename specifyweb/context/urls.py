from django.conf.urls import patterns

urlpatterns = patterns(
    'specifyweb.context.views',
    (r'^login/$', 'api_login'),
    (r'^collection/$', 'collection'),
    (r'^user.json$', 'user'),
    (r'^domain.json$', 'domain'),
    (r'^view.json$', 'view'),
    (r'^datamodel.json$', 'datamodel'),
    (r'^schema_localization.json$', 'schema_localization'),
    (r'^app.resource$', 'app_resource'),
    (r'^available_related_searches.json$', 'available_related_searches'),
    (r'^attachment_settings.json$', 'attachment_settings'),
    (r'^report_runner_status.json$', 'report_runner_status'),
    (r'^remoteprefs.properties$', 'remote_prefs')
)
