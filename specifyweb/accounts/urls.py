from django.conf import settings
from django.contrib.auth import views as auth_views
from django.urls import path

from specifyweb.permissions.permissions import skip_collection_access_check
from . import views

urlpatterns = [
    # Login with Specify username and password:
    path('legacy_login/', auth_views.LoginView.as_view(template_name='login.html')),

    # OpenId Connect callback endpoint:
    path('oic_callback/', views.oic_callback),

    path(
        'logout/',
        skip_collection_access_check(auth_views.LogoutView.as_view(next_page='/accounts/login/'))
    ),

    path(
        'password_change/',
        skip_collection_access_check(
            auth_views.PasswordChangeView.as_view(
                template_name='password_change.html', success_url='/'))
    ),

    path(
        'choose_collection/',
        skip_collection_access_check(views.choose_collection)
    ),

    path('support_login/', views.support_login),

    # API endpoint to generate an invite link:
    path('invite_link/<int:userid>/', views.invite_link),

    # Invite links point here:
    path('use_invite_link/', views.use_invite_link),

    # Return a list of configured identity providers.
    path('oic_providers/', views.oic_providers),

    # Return a list of configured identity providers
    # which the specified user has registered identities with.
    path('oic_providers/<int:userid>/', views.user_providers),
]

if settings.OAUTH_LOGIN_PROVIDERS:
    urlpatterns.append(
        path('login/', views.oic_login)
    )
else:
    urlpatterns.append(
        path('login/', auth_views.LoginView.as_view(template_name='login.html'))
    )
