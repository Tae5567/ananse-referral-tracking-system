import uuid

from django.db import models

from common.models import TimestampedModel

# Create your models here.
class Referral(TimestampedModel):
    # Sales representative
    name = models.CharField(max_length=150)

    code = models.SlugField(unique=True)

    active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Visitor(TimestampedModel):
    # Anonymous website visitor
    visitor_id = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        unique=True,
    )

    ip_address = models.GenericIPAddressField(
        blank=True,
        null=True,
    )

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
        related_name="clicks"
    )

    landing_page = models.CharField(
        max_length= 255,
        default="/",
    )


class Meta:
    ordering = [ "-created_at", ]


def __str__(self):
    return f"{self.referral.name}"