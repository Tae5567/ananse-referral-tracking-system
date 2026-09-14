from django.urls import path

from .views import StaffDetailAPIView, StaffListCreateAPIView, StaffOptionsAPIView

urlpatterns = [
    path("staff/", StaffListCreateAPIView.as_view(), name="staff-list-create"),
    path("staff/options/", StaffOptionsAPIView.as_view(), name="staff-options"),
    path("staff/<int:user_id>/", StaffDetailAPIView.as_view(), name="staff-detail"),
]
