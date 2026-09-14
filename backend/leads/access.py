from django.db.models import Q

from accounts.permissions import is_manager
from .models import Lead


def leads_for_user(user):
    queryset = Lead.objects.select_related(
        "referral",
        "referral__owner",
        "referral__managed_by",
        "assigned_to",
    )

    if is_manager(user):
        return queryset

    return queryset.filter(
        Q(referral__owner=user)
        | Q(assigned_to=user)
        | Q(referral__managed_by=user)
    ).distinct()
