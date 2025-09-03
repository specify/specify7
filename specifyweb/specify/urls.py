from django.urls import include, path, re_path
from . import schema, views

urlpatterns = [
    # check if the user is new at login
    re_path(r'^specify/is_new_user/$', views.is_new_user),

    # the main business data API
    re_path(r'^specify_schema/openapi.json$', schema.openapi),
    re_path(r'^specify_schema/(?P<model>\w+)/$', schema.view),
    re_path(r'^specify/(?P<model>\w+)/(?P<id>\d+)/$', views.resource), # permissions added
    re_path(r'^specify/(?P<model>\w+)/$', views.collection), # permissions added

    # this url always triggers a 500 for testing purposes
    re_path(r'^test_error/', views.raise_error),

    # === Backwards compatibility ===

    # Merge endpoints
    re_path(r'^specify/merge/', include('specifyweb.backend.merge.urls')),

    # Inheritance (catalog number endpoints)
    re_path(r'^specify/', include('specifyweb.backend.inheritance.urls')),

    # Series endpoints
    re_path(r'^specify', include('specifyweb.backend.series.urls')),

    # Table rows
    re_path(r'^', include('specifyweb.backend.table_rows.urls')),

    # Delete blockers
    re_path(r'^', include('specifyweb.backend.delete_blockers.urls')),

    ## Bulk copy
    re_path(r'^', include('specifyweb.backend.bulk_copy.urls')),

    # Trees
    re_path(r'^', include('specifyweb.backend.trees.urls')),

    # Locality update tool
    re_path(r'^', include('specifyweb.backend.locality_update_tool.urls')),

    # Master key + User management
    re_path(r'^', include('specifyweb.backend.accounts.urls')),
]
