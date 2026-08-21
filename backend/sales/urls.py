from django.urls import path

from .views import CustomSaleCreateView


urlpatterns = [
    path(
        "custom-sales/",
        CustomSaleCreateView.as_view(),
        name="custom-sale-create",
    ),
]