import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("leads", "0004_lead_service_name_alter_lead_interest"),
    ]

    operations = [
        migrations.AddField(
            model_name="lead",
            name="assigned_to",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="assigned_leads",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="lead",
            name="internal_notes",
            field=models.TextField(blank=True),
        ),
        migrations.AlterField(
            model_name="lead",
            name="status",
            field=models.CharField(
                choices=[
                    ("new", "New"),
                    ("contacted", "Contacted"),
                    ("follow_up", "Follow-up Required"),
                    ("quoted", "Quote Sent"),
                    ("converted", "Converted"),
                    ("lost", "Lost"),
                ],
                default="new",
                max_length=20,
            ),
        ),
    ]
