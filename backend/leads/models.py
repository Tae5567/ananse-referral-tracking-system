from django.contrib.auth.models import User
from django.db import models

from common.models import TimestampedModel
from referrals.models import Referral, Visitor


class Lead(TimestampedModel):
    class Interest(models.TextChoices):
        FASHION_HUB = ("fashion_hub", "Ananse Center for Design")
        CUSTOM_SERVICE = ("custom_service", "Custom Service")

    class Status(models.TextChoices):
        NEW = ("new", "New")
        CONTACTED = ("contacted", "Contacted")
        FOLLOW_UP = ("follow_up", "Follow-up Required")
        QUOTED = ("quoted", "Quote Sent")
        CONVERTED = ("converted", "Converted")
        LOST = ("lost", "Lost")

    referral = models.ForeignKey(
        Referral,
        on_delete=models.CASCADE,
        related_name="leads",
    )
    visitor = models.ForeignKey(
        Visitor,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
    )
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="assigned_leads",
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True)
    email = models.EmailField(db_index=True)
    phone = models.CharField(max_length=20, db_index=True)
    interest = models.CharField(max_length=30, choices=Interest.choices, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.NEW,
    )
    service_name = models.CharField(max_length=255, blank=True)
    inquiry_message = models.TextField(blank=True)
    internal_notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}".strip()
