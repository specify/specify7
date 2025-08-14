# Entrypoint for the routing of the app

from django.urls import include, path, re_path

from specifyweb.specify import views
from specifyweb.specify.models_utils import schema
from specifyweb.specify import tree_views

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

    # special tree apis
    re_path(r'^specify_tree/(?P<tree>\w+)/', include([ # permissions added
        path('<int:id>/path/', tree_views.path),
        path('<int:id>/merge/', tree_views.merge),
        path('<int:id>/move/', tree_views.move),
        path('<int:id>/bulk_move/', tree_views.bulk_move),
        path('<int:id>/synonymize/', tree_views.synonymize),
        path('<int:id>/desynonymize/', tree_views.desynonymize),
        path('<int:id>/rebuild-full-name', tree_views.rebuild_fullname),
        path('<int:rankid>/tree_rank_item_count/', tree_views.tree_rank_item_count),
        path('<int:parentid>/predict_fullname/', tree_views.predict_fullname),
        re_path(r'^(?P<treedef>\d+)/(?P<parentid>\w+)/stats/$', tree_views.tree_stats),
        re_path(r'^(?P<treeid>\w+)/add_root/$', tree_views.add_root),
        re_path(r'^(?P<treedef>\d+)/(?P<parentid>\w+)/(?P<sortfield>\w+)/$', tree_views.tree_view),
        path('repair/', tree_views.repair_tree),
    ])),

    # Inheritance (catalog number endpoints)
    re_path(r'^specify/', include('specifyweb.backend.inheritance.urls')),

    # Series endpoints
    re_path(r'^specify', include('specifyweb.backend.series.urls')),

    # Table rows
    re_path(r'^', include('specifyweb.backend.table_rows.urls')),

    # Delete blockers
    re_path(r'^', include('specifyweb.backend.delete_blockers.urls')),

    ## Bulk copy
    re_path(r'^specify', include('specifyweb.backend.bulk_copy.urls')),

    # Trees
    re_path(r'^', include('specifyweb.backend.trees.urls')),

    # Locality update tool
    re_path(r'^', include('specifyweb.backend.locality_update_tool.urls')),

    # Master key + User management
    re_path(r'^', include('specifyweb.backend.accounts.urls')),
]
