from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("sales", "0004_order_payment_status"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="archived",
            field=models.BooleanField(db_index=True, default=False),
        ),
        migrations.AddField(
            model_name="customsale",
            name="archived",
            field=models.BooleanField(db_index=True, default=False),
        ),
        migrations.AlterField(
            model_name="order",
            name="payment_status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending"),
                    ("paid", "Paid"),
                    ("not_paid", "Not Paid"),
                    ("failed", "Payment Failed"),
                    ("cancelled", "Cancelled"),
                    ("refunded", "Refunded"),
                ],
                default="pending",
                max_length=20,
            ),
        ),
    ]
