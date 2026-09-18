from django.db import migrations, models


def backfill_total_paid(apps, schema_editor):
    CustomSale = apps.get_model("sales", "CustomSale")
    for sale in CustomSale.objects.all().iterator():
        # Existing rows predate the tax/deposit breakdown. Preserve their
        # previous entered amount as both service value and total paid.
        sale.total_paid = sale.amount
        sale.save(update_fields=["total_paid"])


class Migration(migrations.Migration):

    dependencies = [
        ("sales", "0006_order_customsale_archived"),
    ]
    operations = [
        migrations.AddField(
            model_name="customsale",
            name="facility_type",
            field=models.CharField(
                blank=True,
                choices=[
                    ("", "No security deposit"),
                    ("auditorium", "Auditorium"),
                    ("machinery_room", "Machinery Room / Equipment Rental"),
                    ("meeting_room", "Meeting Room"),
                    ("training_room", "Training Room"),
                    ("showroom", "Showroom"),
                    ("cad_suite", "CAD Suite"),
                    ("podcast_room", "Podcast Room"),
                    ("photo_studio", "Photo Studio"),
                ],
                default="",
                max_length=30,
            ),
        ),
        migrations.AddField(
            model_name="customsale",
            name="tax_amount",
            field=models.DecimalField(
                decimal_places=2,
                default=0,
                max_digits=12,
            ),
        ),
        migrations.AddField(
            model_name="customsale",
            name="security_deposit",
            field=models.DecimalField(
                decimal_places=2,
                default=0,
                max_digits=12,
            ),
        ),
        migrations.AddField(
            model_name="customsale",
            name="total_paid",
            field=models.DecimalField(
                decimal_places=2,
                default=0,
                max_digits=12,
            ),
        ),
        migrations.RunPython(
            backfill_total_paid,
            migrations.RunPython.noop,
        ),
    ]
