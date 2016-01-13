from django.conf.urls import patterns, include, url
from django.views.generic.base import RedirectView

urlpatterns = patterns('',
    (r'^favicon.ico', RedirectView.as_view(url='/static/img/fav_icon.png')),

    # log in and log out pages
    (r'^accounts/login/$', 'specifyweb.context.views.login'),
    (r'^accounts/logout/$', 'specifyweb.context.views.logout'),

    (r'^accounts/support_login/$', 'specifyweb.specify.views.support_login'),

    (r'^accounts/password_change/$', 'django.contrib.auth.views.password_change',
     {'template_name': 'password_change.html',
      'post_change_redirect': '/'}),

    # just redirect root url to the main specify view
    url(r'^$', RedirectView.as_view(url='/specify/')),

    # This is the main specify view.
    # Every URL beginning with '/specify/' is handled
    # by the frontend. 'frontend.urls' just serves the
    # empty webapp container for all these URLs.
    url(r'^specify/', include('specifyweb.frontend.urls')),

    # the main business data API
    url(r'^api/specify_rows/(?P<model>\w+)/$', 'specifyweb.specify.views.rows'),
    url(r'^api/specify/(?P<model>\w+)/(?P<id>\d+)/$', 'specifyweb.specify.views.resource'),
    url(r'^api/specify/(?P<model>\w+)/$', 'specifyweb.specify.views.collection'),

    url(r'^api/delete_blockers/(?P<model>\w+)/(?P<id>\d+)/$', 'specifyweb.specify.views.delete_blockers'),

    # this url always triggers a 500 for testing purposes
    url(r'^api/test_error/', 'specifyweb.specify.views.raise_error'),

    # special tree apis
    url(r'^api/specify_tree/(?P<model>\w+)/(?P<id>\d+)/path/$', 'specifyweb.specify.tree_views.path'),
    url(r'^api/specify_tree/(?P<tree>\w+)/(?P<treedef>\d+)/(?P<parentid>\w+)/$', 'specifyweb.specify.tree_views.tree_view'),
    url(r'^api/specify_tree/(?P<tree>\w+)/(?P<treedef>\d+)/(?P<parentid>\w+)/stats/$', 'specifyweb.specify.tree_views.tree_stats'),

    # generates Sp6 master key
    url(r'^api/master_key/$', 'specifyweb.specify.master_key.master_key'),

    # interaction api stuff
    url(r'^api/', include('specifyweb.interactions.urls')),

    # workbench api
    url(r'^api/workbench/', include('specifyweb.workbench.urls')),

    # set a user's password
    url(r'^api/set_password/(?P<userid>\d+)/$', 'specifyweb.specify.views.set_password'),
    url(r'^api/set_admin_status/(?P<userid>\d+)/$', 'specifyweb.specify.views.set_admin_status'),

    # access to various UI and app resources starts here
    url(r'^images/(?P<path>.+)$', 'specifyweb.specify.views.images'),
    url(r'^properties/(?P<name>.+).properties$', 'specifyweb.specify.views.properties'),

    url(r'^express_search/', include('specifyweb.express_search.urls')),
    url(r'^context/', include('specifyweb.context.urls')),
    url(r'^testcontext/', include('specifyweb.context.testurls')),
    url(r'^stored_query/', include('specifyweb.stored_queries.urls')),
    url(r'^attachment_gw/', include('specifyweb.attachment_gw.urls')),
    url(r'^barvis/', include('specifyweb.barvis.urls')),
    url(r'^report_runner/', include('specifyweb.report_runner.urls')),
)
