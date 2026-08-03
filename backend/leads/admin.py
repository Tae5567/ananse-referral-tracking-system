from django.contrib import admin

from .models import Lead

# Register your models here.

@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = (
        "first_name",
        "last_name",
        "email",
        "phone",
        "interest",
        "status",
        "referral",
    )

    list_filter = (
        "interest",
        "status",
    )

    search_fields = (
        "first_name",
        "last_name",
        "email",
        "phone",
    )