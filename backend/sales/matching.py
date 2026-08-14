from leads.models import Lead

from common.phone import normalize_phone


def normalize_email(email):
    if not email:
        return ""

    return str(email).strip().lower()


def find_matching_lead(email="", phone=""):
    """
    Match an imported order against an existing referral lead.

    Priority:
    1. Email
    2. Phone
    """

    email = normalize_email(email)
    phone = normalize_phone(phone)

    # -------------------------------------------------
    # 1. Email match
    # -------------------------------------------------

    if email:
        lead = (
            Lead.objects
            .filter(email__iexact=email)
            .order_by("-created_at")
            .first()
        )

        if lead:
            return lead, "email"

    # -------------------------------------------------
    # 2. Phone match
    # -------------------------------------------------

    if phone:
        leads = Lead.objects.exclude(phone="")

        for lead in leads:
            if normalize_phone(lead.phone) == phone:
                return lead, "phone"

    return None, ""