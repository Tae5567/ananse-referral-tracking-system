from django.urls import path

from .views import (
    LeadCreateAPIView,
    InquiryCreateAPIView,
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
]