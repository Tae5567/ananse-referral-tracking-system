from django.urls import path

from .views import CustomSaleCreateView, OrderCSVImportAPIView, OrderPaymentStatusAPIView, OrderStatusUpdateAPIView


urlpatterns = [
    path(
        "custom-sales/",
        CustomSaleCreateView.as_view(),
        name="custom-sale-create",
    ),
    path(
        "orders/<int:order_id>/payment-status/",
        OrderPaymentStatusAPIView.as_view(),
    ),
    path(
        "orders/import/",
        OrderCSVImportAPIView.as_view(),
    ),
    path(
        "orders/<int:order_id>/status/",
        OrderStatusUpdateAPIView.as_view(),
    ),
]