from django.urls import path

from . import views

urlpatterns = [
    path('user_policies/', views.UserPolicyCollection.as_view()),
]
