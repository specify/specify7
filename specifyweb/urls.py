from django.conf.urls import include, url
from django.views.generic.base import RedirectView
from django.contrib.auth import views as auth_views

from .specify.views import support_login, images, properties
from .context.views import choose_collection

from .specify import urls as api_urls
from .frontend import urls as frontend_urls
from .workbench import urls as wb_urls
from .express_search import urls as es_urls
from .context import urls as context_urls
from .stored_queries import urls as query_urls
from .attachment_gw import urls as attachment_urls
from .barvis import urls as tt_urls
from .report_runner import urls as report_urls
from .interactions import urls as interaction_urls
from .notifications import urls as notification_urls
from .export import urls as export_urls

urlpatterns = [
    url(r'^favicon.ico', RedirectView.as_view(url='/static/img/fav_icon.png')),

    # log in and log out pages
    url(r'^accounts/login/$', auth_views.login, {'template_name': 'login.html'}),
    url(r'^accounts/logout/$', auth_views.logout, {'template_name': 'logout.html', 'next_page': '/accounts/login/'}),
    url(r'^accounts/password_change/$', auth_views.password_change,
        {'template_name': 'password_change.html', 'post_change_redirect': '/'}),

    url(r'^accounts/support_login/$', support_login),

    url(r'^accounts/choose_collection/$', choose_collection),

    # just redirect root url to the main specify view
    url(r'^$', RedirectView.as_view(url='/specify/')),

    # This is the main specify view.
    # Every URL beginning with '/specify/' is handled
    # by the frontend. 'frontend.urls' just serves the
    # empty webapp container for all these URLs.
    url(r'^specify/', include(frontend_urls)),

    # primary api
    url(r'^api/', include(api_urls)),
    url(r'^images/(?P<path>.+)$', images),
    url(r'^properties/(?P<name>.+).properties$', properties),


    # submodules
    url(r'^api/workbench/', include(wb_urls)),
    url(r'^express_search/', include(es_urls)),
    url(r'^context/', include(context_urls)),
    url(r'^stored_query/', include(query_urls)),
    url(r'^attachment_gw/', include(attachment_urls)),
    url(r'^barvis/', include(tt_urls)),
    url(r'^report_runner/', include(report_urls)),
    url(r'^interactions/', include(interaction_urls)),
    url(r'^notifications/', include(notification_urls)),
    url(r'^export/', include(export_urls)),
    # url(r'^testcontext/', include()),
]
