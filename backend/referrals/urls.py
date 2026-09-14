from django.urls import path

from .management_views import ManagedReferralDetailAPIView, ManagedReferralListCreateAPIView
from .views import ReferralLandingAPIView

urlpatterns = [
    path("manage/", ManagedReferralListCreateAPIView.as_view(), name="managed-referrals"),
    path("manage/<int:referral_id>/", ManagedReferralDetailAPIView.as_view(), name="managed-referral-detail"),
    path("<slug:code>/", ReferralLandingAPIView.as_view()),
]
