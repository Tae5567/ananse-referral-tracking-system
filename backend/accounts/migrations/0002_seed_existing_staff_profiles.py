from django.conf import settings
from django.db import migrations


def create_existing_profiles(apps, schema_editor):
    User = apps.get_model(*settings.AUTH_USER_MODEL.split("."))
    StaffProfile = apps.get_model("accounts", "StaffProfile")

    for user in User.objects.all():
        role = "manager" if user.is_superuser or user.username.lower() == "camille" else "sales_rep"
        StaffProfile.objects.get_or_create(
            user_id=user.id,
            defaults={"role": role, "active": user.is_active},
        )


def reverse_profiles(apps, schema_editor):
    # Do not remove staff profiles on reverse migration because they may have
    # been edited after deployment.
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(create_existing_profiles, reverse_profiles),
    ]
