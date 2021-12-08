from django.urls import path
from django.contrib.auth import views as auth_views

from . import views


urlpatterns = [
    path('login/', views.oic_login),
    path('legacy_login/', auth_views.LoginView.as_view(template_name='login.html')),
    path('oic_callback/', views.oic_callback),
    path('logout/', auth_views.LogoutView.as_view(template_name='logout.html', next_page='/accounts/login/')),
    path('password_change/', auth_views.PasswordChangeView.as_view(
        template_name='password_change.html', success_url='/')),

    path('support_login/', views.support_login),
    path('choose_collection/', views.choose_collection),
]
