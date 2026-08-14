from django.db import models

from common.models import TimestampedModel
from leads.models import Lead


class Order(TimestampedModel):
    """
    A transaction imported from the Ananse Center for Design
    / Fashion Hub transaction export.
    """

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