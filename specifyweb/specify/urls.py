# Entrypoint for the routing of the app

from django.conf.urls import include, url

from . import master_key
from . import schema
from . import tree_views
from . import views

urlpatterns = [
    # replace record
    url(r'^specify/(?P<model_name>\w+)/replace/(?P<new_model_id>\d+)/$', views.record_merge),
    url(r'^specify/merge/status/(?P<merge_id>[0-9a-fA-F-]+)/$', views.merging_status),
    url(r'^specify/merge/abort/(?P<merge_id>[0-9a-fA-F-]+)/$', views.abort_merge_task),

    # the main business data API
    url(r'^specify_schema/openapi.json$', schema.openapi),
    url(r'^specify_schema/(?P<model>\w+)/$', schema.view),
    url(r'^specify/(?P<model>\w+)/(?P<id>\d+)/$', views.resource), # permissions added
    url(r'^specify/(?P<model>\w+)/$', views.collection), # permissions added
    url(r'^specify_rows/(?P<model>\w+)/$', views.rows), # permissions added

    url(r'^delete_blockers/(?P<model>\w+)/(?P<id>\d+)/$', views.delete_blockers),

    # this url always triggers a 500 for testing purposes
    url(r'^test_error/', views.raise_error),

    # special tree apis
    url(r'^specify_tree/(?P<tree>\w+)/', include([ # permissions added
        url(r'^(?P<id>\d+)/path/$', tree_views.path),
        url(r'^(?P<id>\d+)/merge/$', tree_views.merge),
        url(r'^(?P<id>\d+)/move/$', tree_views.move),
        url(r'^(?P<id>\d+)/synonymize/$', tree_views.synonymize),
        url(r'^(?P<id>\d+)/desynonymize/$', tree_views.desynonymize),
        url(r'^(?P<parentid>\d+)/predict_fullname/$', tree_views.predict_fullname),
        url(r'^(?P<treedef>\d+)/(?P<parentid>\w+)/stats/$', tree_views.tree_stats),
        url(r'^(?P<treedef>\d+)/(?P<parentid>\w+)/(?P<sortfield>\w+)/$', tree_views.tree_view),
        url(r'^repair/$', tree_views.repair_tree),
    ])),

    # generates Sp6 master key
    url(r'^master_key/$', master_key.master_key),

    # set a user's password
    url(r'^set_password/(?P<userid>\d+)/$', views.set_password),
    url(r'^set_admin_status/(?P<userid>\d+)/$', views.set_admin_status),
    url(r'^set_agents/(?P<userid>\d+)/$', views.set_user_agents)
]
