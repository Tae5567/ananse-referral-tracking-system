import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("referrals", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="referral",
            name="source_type",
            field=models.CharField(
                choices=[
                    ("staff", "Staff"),
                    ("influencer", "Influencer"),
                    ("partner", "Partner"),
                    ("campaign", "Campaign"),
                ],
                default="staff",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="referral",
            name="owner",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="owned_referrals",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="referral",
            name="managed_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="managed_referrals",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="referral",
            name="parent",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="sub_links",
                to="referrals.referral",
            ),
        ),
    ]
