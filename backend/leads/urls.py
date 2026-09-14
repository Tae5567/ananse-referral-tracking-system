from django.urls import path

from .views import (
    InquiryCreateAPIView,
    InquiryListAPIView,
    InquiryStatusUpdateAPIView,
    LeadCreateAPIView,
    LeadDetailAPIView,
    LeadListAPIView,
    LeadUpdateAPIView,
)

urlpatterns = [
    path("", LeadCreateAPIView.as_view(), name="lead-create"),
    path("manage/", LeadListAPIView.as_view(), name="lead-list"),
    path("manage/<int:lead_id>/", LeadDetailAPIView.as_view(), name="lead-detail"),
    path("manage/<int:lead_id>/update/", LeadUpdateAPIView.as_view(), name="lead-update"),
    path("inquiry/", InquiryCreateAPIView.as_view(), name="inquiry-create"),
    path("inquiries/", InquiryListAPIView.as_view(), name="inquiry-list"),
    path(
        "inquiries/<int:inquiry_id>/status/",
        InquiryStatusUpdateAPIView.as_view(),
        name="inquiry-status-update",
    ),
]
