from django.urls import path

from .manager_views import ManagerDashboardAPIView
from .views import DashboardView

urlpatterns = [
    path("", DashboardView.as_view(), name="dashboard"),
    path("management/", ManagerDashboardAPIView.as_view(), name="management-dashboard"),
]
