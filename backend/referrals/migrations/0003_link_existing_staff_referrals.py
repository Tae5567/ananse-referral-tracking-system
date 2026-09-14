from django.conf import settings
from django.db import migrations


def link_existing_referrals(apps, schema_editor):
    User = apps.get_model(*settings.AUTH_USER_MODEL.split("."))
    Referral = apps.get_model("referrals", "Referral")

    users_by_username = {
        user.username.lower(): user
        for user in User.objects.all()
    }

    for referral in Referral.objects.filter(owner__isnull=True, source_type="staff"):
        user = users_by_username.get(referral.code.lower())
        if user:
            referral.owner_id = user.id
            referral.managed_by_id = user.id
            referral.save(update_fields=["owner", "managed_by"])


def unlink_existing_referrals(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("referrals", "0002_referral_ownership_and_source"),
    ]

    operations = [
        migrations.RunPython(link_existing_referrals, unlink_existing_referrals),
    ]
