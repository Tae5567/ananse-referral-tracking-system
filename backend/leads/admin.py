from django.contrib import admin

from .models import Lead


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = (
        "first_name",
        "last_name",
        "email",
        "phone",
        "interest",
        "service_name",
        "status",
        "referral",
        "assigned_to",
    )
    list_filter = ("interest", "status", "referral__source_type", "assigned_to")
    search_fields = (
        "first_name",
        "last_name",
        "email",
        "phone",
        "service_name",
    )
