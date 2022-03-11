from django.conf.urls import include, url
from django.views.generic.base import RedirectView
from django.contrib.auth import views as auth_views

from .specify.views import support_login, images, properties
from .context.views import choose_collection

from .specify import urls as api_urls
from .frontend import urls as frontend_urls, doc_urls
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
from .permissions import urls as permissions_urls

urlpatterns = [
    url(r'^favicon.ico', RedirectView.as_view(url='/static/img/fav_icon.png')),

    # log in and log out pages
    url(r'^accounts/login/$', auth_views.LoginView.as_view(template_name='login.html')),
    url(r'^accounts/logout/$', auth_views.LogoutView.as_view(next_page='/accounts/login/')),
    url(r'^accounts/password_change/$', auth_views.PasswordChangeView.as_view(
        template_name='password_change.html', success_url='/')),

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

    url(r'^documentation/', include(doc_urls)),

    # submodules
    url(r'^api/workbench/', include(wb_urls)), # permissions added
    url(r'^express_search/', include(es_urls)),
    url(r'^context/', include(context_urls)),
    url(r'^stored_query/', include(query_urls)),
    url(r'^attachment_gw/', include(attachment_urls)),
    url(r'^barvis/', include(tt_urls)),
    url(r'^report_runner/', include(report_urls)),
    url(r'^interactions/', include(interaction_urls)),
    url(r'^notifications/', include(notification_urls)),
    url(r'^export/', include(export_urls)),
    url(r'^permissions/', include(permissions_urls)), # permissions added
    # url(r'^testcontext/', include()),
]
