from django.urls import path

from .views import (
    LeadCreateAPIView,
    InquiryCreateAPIView,
    InquiryListAPIView,
    InquiryStatusUpdateAPIView,
)


urlpatterns = [
    path(
        "",
        LeadCreateAPIView.as_view(),
        name="lead-create",
    ),

    path(
        "inquiry/",
        InquiryCreateAPIView.as_view(),
        name="inquiry-create",
    ),
    path(
        "inquiries/",
        InquiryListAPIView.as_view(),
        name="inquiry-list",
    ),
    path(
        "inquiries/<int:inquiry_id>/status/",
        InquiryStatusUpdateAPIView.as_view(),
        name="inquiry-status-update",
    ),
]