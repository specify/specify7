from django.urls import include, path, re_path

from specifyweb.backend.trees import tree_views

urlpatterns = [
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
]