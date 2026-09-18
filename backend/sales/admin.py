from django.contrib import admin

from .models import Order, CustomSale


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):

    list_display = (
        "reference",
        "customer_email",
        "customer_phone",
        "product_name",
        "total_amount",
        "matched_lead",
        "match_method",
        "status",
        "purchase_date",
    )

    list_filter = (
        "status",
        "match_method",
    )

    search_fields = (
        "reference",
        "external_id",
        "customer_email",
        "customer_phone",
        "customer_first_name",
        "customer_last_name",
        "product_name",
    )

    readonly_fields = (
        "imported_at",
    )


@admin.register(CustomSale)
class CustomSaleAdmin(admin.ModelAdmin):
    list_display = (
        "customer_first_name",
        "customer_last_name",
        "service_name",
        "amount",
        "tax_amount",
        "security_deposit",
        "total_paid",
        "facility_type",
        "payment_method",
        "status",
        "facility_type",
        "sale_date",
        "lead",
    )

    list_filter = (
        "payment_method",
        "status",
    )

    search_fields = (
        "customer_first_name",
        "customer_last_name",
        "customer_email",
        "customer_phone",
        "service_name",
    )