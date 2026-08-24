from django.db import models

from common.models import TimestampedModel
from leads.models import Lead


class Order(TimestampedModel):
    """
    A transaction imported from the Ananse Center for Design
    / Fashion Hub transaction export.
    """

    PAYMENT_STATUS_CHOICES = [
        ("pending", "Pending"),
        ("paid", "Paid"),
        ("failed", "Payment Failed"),
        ("cancelled", "Cancelled"),
        ("refunded", "Refunded"),
    ]

    external_id = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
    )

    reference = models.CharField(
        max_length=150,
        blank=True,
        db_index=True,
    )

    status = models.CharField(
        max_length=100,
        blank=True,
    )

    customer_first_name = models.CharField(
        max_length=100,
        blank=True,
    )

    customer_last_name = models.CharField(
        max_length=100,
        blank=True,
    )

    customer_email = models.EmailField(
        blank=True,
        db_index=True,
    )

    customer_phone = models.CharField(
        max_length=30,
        blank=True,
        db_index=True,
    )

    product_name = models.CharField(
        max_length=255,
        blank=True,
    )

    product_code = models.CharField(
        max_length=150,
        blank=True,
    )

    quantity = models.PositiveIntegerField(
        default=1,
    )

    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )

    tax_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )

    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )

    purchase_date = models.DateTimeField(
        null=True,
        blank=True,
    )



    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default="pending",
    )

    matched_lead = models.ForeignKey(
        Lead,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
    )

    match_method = models.CharField(
        max_length=30,
        blank=True,
    )

    raw_data = models.JSONField(
        default=dict,
        blank=True,
    )

    imported_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return f"{self.reference or self.external_id} - {self.customer_email}"

    @property
    def is_matched(self):
        return self.matched_lead_id is not None


class CustomSale(TimestampedModel):
    """
    Manually recorded sale for services paid outside
    the Ananse Center for Design website.
    """

    PAYMENT_METHODS = [
        ("bank_transfer", "Bank Transfer"),
        ("onsite", "Onsite"),
        ("other", "Other"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("paid", "Paid"),
        ("cancelled", "Cancelled"),
    ]

    lead = models.ForeignKey(
        Lead,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="custom_sales",
    )

    customer_first_name = models.CharField(
        max_length=100,
    )

    customer_last_name = models.CharField(
        max_length=100,
        blank=True,
    )

    customer_email = models.EmailField(
        blank=True,
    )

    customer_phone = models.CharField(
        max_length=30,
        blank=True,
    )

    service_name = models.CharField(
        max_length=255,
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    payment_method = models.CharField(
        max_length=30,
        choices=PAYMENT_METHODS,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="paid",
    )

    notes = models.TextField(
        blank=True,
    )

    sale_date = models.DateTimeField()

    def __str__(self):
        return (
            f"{self.customer_first_name} "
            f"{self.customer_last_name} - "
            f"{self.service_name}"
        )