from django.urls import path

from .views import (
    CustomSaleArchiveAPIView,
    CustomSaleCreateView,
    CustomSaleSourceOptionsAPIView,
    OrderArchiveAPIView,
    OrderCSVImportAPIView,
    OrderPaymentStatusAPIView,
    OrderStatusUpdateAPIView,
)


urlpatterns = [
    path(
        "custom-sales/",
        CustomSaleCreateView.as_view(),
        name="custom-sale-create",
    ),
    path(
        "custom-sales/source-options/",
        CustomSaleSourceOptionsAPIView.as_view(),
        name="custom-sale-source-options",
    ),
    path(
        "custom-sales/<int:sale_id>/archive/",
        CustomSaleArchiveAPIView.as_view(),
        name="custom-sale-archive",
    ),
    path(
        "orders/<int:order_id>/payment-status/",
        OrderPaymentStatusAPIView.as_view(),
        name="order-payment-status",
    ),
    path(
        "orders/<int:order_id>/archive/",
        OrderArchiveAPIView.as_view(),
        name="order-archive",
    ),
    path(
        "orders/import/",
        OrderCSVImportAPIView.as_view(),
        name="order-import",
    ),
    path(
        "orders/<int:order_id>/status/",
        OrderStatusUpdateAPIView.as_view(),
        name="order-status-legacy",
    ),
]
