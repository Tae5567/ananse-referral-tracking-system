from django.contrib import admin

from .models import Referral, ReferralClick, Visitor


@admin.register(Referral)
class ReferralAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "code",
        "source_type",
        "owner",
        "managed_by",
        "parent",
        "active",
        "created_at",
    )
    list_filter = ("source_type", "active")
    search_fields = (
        "name",
        "code",
        "owner__username",
        "owner__first_name",
        "owner__last_name",
    )


@admin.register(Visitor)
class VisitorAdmin(admin.ModelAdmin):
    list_display = ("visitor_id", "ip_address", "created_at")


@admin.register(ReferralClick)
class ReferralClickAdmin(admin.ModelAdmin):
    list_display = ("referral", "visitor", "created_at")
