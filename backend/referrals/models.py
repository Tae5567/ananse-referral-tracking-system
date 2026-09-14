import uuid

from django.contrib.auth.models import User
from django.db import models

from common.models import TimestampedModel


class Referral(TimestampedModel):
    class SourceType(models.TextChoices):
        STAFF = "staff", "Staff"
        INFLUENCER = "influencer", "Influencer"
        PARTNER = "partner", "Partner"
        CAMPAIGN = "campaign", "Campaign"

    name = models.CharField(max_length=150)
    code = models.SlugField(unique=True)
    active = models.BooleanField(default=True)

    source_type = models.CharField(
        max_length=20,
        choices=SourceType.choices,
        default=SourceType.STAFF,
    )

    # Internal staff member who owns this referral source. Staff referrals
    # should have an owner; external referrals can leave this blank.
    owner = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="owned_referrals",
    )

    # Internal staff member responsible for following up external sources.
    # This is particularly useful for influencers/partners.
    managed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="managed_referrals",
    )

    # Reserved for campaign/sub-link functionality. A campaign can point back
    # to a staff/influencer/partner parent referral while preserving attribution.
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="sub_links",
    )

    def __str__(self):
        return self.name


class Visitor(TimestampedModel):
    visitor_id = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        unique=True,
    )
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)

    def __str__(self):
        return str(self.visitor_id)


class ReferralClick(TimestampedModel):
    referral = models.ForeignKey(
        Referral,
        on_delete=models.CASCADE,
        related_name="clicks",
    )
    visitor = models.ForeignKey(
        Visitor,
        on_delete=models.CASCADE,
        related_name="clicks",
    )
    landing_page = models.CharField(max_length=255, default="/")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.referral.name} - {self.visitor.visitor_id}"
