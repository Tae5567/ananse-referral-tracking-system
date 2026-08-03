from django.contrib import admin

from .models import Referral
from .models import ReferralClick
from .models import Visitor

# Register your models here.
@admin.register(Referral)
class ReferralAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "code",
        "active",
        "created_at",
    )

    search_fields = (
        "name",
        "code",
    )


@admin.register(Visitor)
class VisitorAdmin(admin.ModelAdmin):
    list_display = (
        "visitor_id",
        "ip_address",
        "created_at",
    )


@admin.register(ReferralClick)
class ReferralClickAdmin(admin.ModelAdmin):
    list_display = (
        "referral",
        "visitor",
        "created_at",
    )
