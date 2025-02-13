# Entrypoint for the routing of the app

from django.urls import include, path, re_path

from . import master_key
from . import schema
from . import tree_views
from . import views

urlpatterns = [
    # replace record
    re_path(r'^specify/(?P<model_name>\w+)/replace/(?P<new_model_id>\d+)/$', views.record_merge),
    re_path(r'^specify/merge/status/(?P<merge_id>[0-9a-fA-F-]+)/$', views.merging_status),
    re_path(r'^specify/merge/abort/(?P<merge_id>[0-9a-fA-F-]+)/$', views.abort_merge_task),

    # the main business data API
    re_path(r'^specify_schema/openapi.json$', schema.openapi),
    re_path(r'^specify_schema/(?P<model>\w+)/$', schema.view),
    re_path(r'^specify/(?P<model>\w+)/(?P<id>\d+)/$', views.resource), # permissions added
    re_path(r'^specify/bulk/(?P<model>\w+)/(?P<copies>\d+)/$', views.collection_bulk_copy), # permissions added
    re_path(r'^specify/bulk/(?P<model>\w+)/$', views.collection_bulk), # permissions added
    re_path(r'^specify/(?P<model>\w+)/$', views.collection), # permissions added
    re_path(r'^specify_rows/(?P<model>\w+)/$', views.rows), # permissions added  

    re_path(r'^delete_blockers/(?P<model>\w+)/(?P<id>\d+)/$', views.delete_blockers),

    # this url always triggers a 500 for testing purposes
    re_path(r'^test_error/', views.raise_error),

    path('specify_trees/', tree_views.all_tree_information),

    # special tree apis
    re_path(r'^specify_tree/(?P<tree>\w+)/', include([ # permissions added
        path('<int:id>/path/', tree_views.path),
        path('<int:id>/merge/', tree_views.merge),
        path('<int:id>/move/', tree_views.move),
        path('<int:id>/bulk_move/', tree_views.bulk_move),
        path('<int:id>/synonymize/', tree_views.synonymize),
        path('<int:id>/desynonymize/', tree_views.desynonymize),
        path('<int:rankid>/tree_rank_item_count/', tree_views.tree_rank_item_count),
        path('<int:parentid>/predict_fullname/', tree_views.predict_fullname),
        re_path(r'^(?P<treedef>\d+)/(?P<parentid>\w+)/stats/$', tree_views.tree_stats),
        re_path(r'^(?P<treeid>\w+)/add_root/$', tree_views.add_root),
        re_path(r'^(?P<treedef>\d+)/(?P<parentid>\w+)/(?P<sortfield>\w+)/$', tree_views.tree_view),
        path('repair/', tree_views.repair_tree),
    ])),

    # locality set import endpoints
    path('localityset/', include([
        path('parse/', views.parse_locality_set),
        path('import/', views.upload_locality_set),
        re_path(r'^status/(?P<taskid>[0-9a-fA-F-]+)/$', views.localityupdate_status),
        re_path(r'^abort/(?P<taskid>[0-9a-fA-F-]+)/$', views.abort_localityupdate_task),
    ])),

    # generates Sp6 master key
    path('master_key/', master_key.master_key),

    # set a user's password
    path('set_password/<int:userid>/', views.set_password),
    path('set_admin_status/<int:userid>/', views.set_admin_status),
    path('set_agents/<int:userid>/', views.set_user_agents)
]
