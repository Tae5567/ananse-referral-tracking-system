from django.db import models

from decimal import Decimal

from common.models import TimestampedModel
from leads.models import Lead
from referrals.models import Referral


# Create your models here.
class FashionHubOrder(TimestampedModel):
    # Imported from the Ananse Daily Transactions CVS export

    class MatchMethod(models.TextChoices):
        EMAIL = "email", "Email"
        PHONE = "phone", "Phone"
        MANUAL = "manual", "Manual"

    order_reference = models.CharField(max_length=100, unique=True,)


    referral = models.ForeignKey(
        Referral,
        on_delete=models.CASCADE,
        related_name="orders",
    )

    lead = models.ForeignKey(
        Lead,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
    )

    customer_name = models.CharField(
        max_length=200,
    )

    customer_email = models.EmailField(
        blank=True,
    )

    customer_phone = models.CharField(
        max_length=30,
        blank=True,
    )

    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    tax_rate = models.DecimalField(
        max_digits=5,
        decimal_places=3,
        default=Decimal("0.075"),
    )

    matched = models.BooleanField(
        default=False,
    )

    match_method = models.CharField(
        max_length=20,
        choices=MatchMethod.choices,
        blank=True,
    )

    order_date = models.DateTimeField()

    def __str__(self):
        return self.order_reference


class ManualSale(TimestampedModel):
    # Services that aren't purchased through alpha.ananse

    class PaymentMethod(models.TextChoices):
        BANK_TRANSFER = "bank_transfer", "Bank Transfer"
        CASH = "cash", "Cash"
        POS = "pos", "POS"
        OTHER = "other", "Other"

    referral = models.ForeignKey(
        Referral,
        on_delete=models.CASCADE,
        related_name="manual_sales",
    )

    lead = models.ForeignKey(
        Lead,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="manual_sales",
    )

    customer_name = models.CharField(max_length=200,)

    service_name = models.CharField(max_length=200,)

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    payment_method = models.CharField(
        max_length=30,
        choices=PaymentMethod.choices,
    )

    notes = models.TextField(blank=True,)

    sale_date = models.DateField()

    def __str__(self):
        return f"{self.customer_name} - {self.service_name}"


