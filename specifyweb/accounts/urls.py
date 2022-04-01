from django.urls import path
from django.contrib.auth import views as auth_views
from django.conf import settings

from . import views


urlpatterns = [
    path('login/',
         views.oic_login
         if settings.OAUTH_LOGIN_PROVIDERS is not None
         else auth_views.LoginView.as_view(template_name='login.html')
         ),

    # Login with Specify username and password:
    path('legacy_login/', auth_views.LoginView.as_view(template_name='login.html')),

    # OpenId Connect callback endpoint:
    path('oic_callback/', views.oic_callback),

    path('logout/', auth_views.LogoutView.as_view(template_name='logout.html', next_page='/accounts/login/')),
    path('password_change/', auth_views.PasswordChangeView.as_view(
        template_name='password_change.html', success_url='/')),

    path('support_login/', views.support_login),
    path('choose_collection/', views.choose_collection),

    # API endpoint to generate an invite link:
    path('invite_link/<int:userid>/', views.invite_link),

    # Invite links point here:
    path('use_invite_link/', views.use_invite_link),
]
