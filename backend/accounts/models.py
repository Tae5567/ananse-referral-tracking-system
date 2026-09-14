from django.contrib.auth.models import User
from django.db import models

from common.models import TimestampedModel


class StaffProfile(TimestampedModel):
    class Role(models.TextChoices):
        SALES_REP = "sales_rep", "Sales Rep"
        MANAGER = "manager", "Manager / Admin"

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="staff_profile",
    )
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.SALES_REP,
    )
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} - {self.get_role_display()}"
