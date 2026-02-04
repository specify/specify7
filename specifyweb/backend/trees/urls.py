from django.urls import include, path, re_path

from specifyweb.backend.trees import views

urlpatterns = [
    path('specify_trees/', views.all_tree_information),

    # special tree apis
    re_path(r'^specify_tree/(?P<tree>\w+)/', include([ # permissions added
        path('<int:id>/path/', views.path),
        path('<int:id>/merge/', views.merge),
        path('<int:id>/move/', views.move),
        path('<int:id>/bulk_move/', views.bulk_move),
        path('<int:id>/synonymize/', views.synonymize),
        path('<int:id>/desynonymize/', views.desynonymize),
        path('<int:rankid>/tree_rank_item_count/', views.tree_rank_item_count),
        path('<int:parentid>/predict_fullname/', views.predict_fullname),
        re_path(r'^(?P<treedef>\d+)/(?P<parentid>\w+)/stats/$', views.tree_stats),
        re_path(r'^(?P<treeid>\w+)/add_root/$', views.add_root),
        re_path(r'^(?P<treedef>\d+)/(?P<parentid>\w+)/(?P<sortfield>\w+)/$', views.tree_view),
        path('repair/', views.repair_tree),
    ])),

    # Create new trees
    path('create_default_tree/', views.create_default_tree_view),
    re_path(r'^create_default_tree/status/(?P<task_id>[^/]+)/$', views.default_tree_upload_status),
    re_path(r'^create_default_tree/abort/(?P<task_id>[^/]+)/$', views.abort_default_tree_creation),
    re_path(r'^default_tree_mapping/(?P<task_id>[^/]+)/$', views.default_tree_mapping),
]