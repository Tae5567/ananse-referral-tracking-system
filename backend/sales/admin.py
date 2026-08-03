from django.contrib import admin

from .models import FashionHubOrder
from .models import ManualSale

# Register your models here.
@admin.register(FashionHubOrder)
class FashionHubOrderAdmin(admin.ModelAdmin):
    list_display = (
        "order_reference",
        "customer_name",
        "total_amount",
        "matched",
        "match_method",
        "order_date",
    )

    search_fields = (
        "order_reference",
        "customer_name",
        "customer_email",
    )


@admin.register(ManualSale)
class ManualSaleAdmin(admin.ModelAdmin):
    list_display = (
        "customer_name",
        "service_name",
        "amount",
        "payment_method",
        "sale_date",
    )