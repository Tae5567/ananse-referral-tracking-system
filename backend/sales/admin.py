from django.contrib import admin

from .models import Order


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