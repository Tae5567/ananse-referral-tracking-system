import csv
from decimal import Decimal, InvalidOperation

from django.core.management.base import BaseCommand

from sales.models import Order
from sales.matching import find_matching_lead


def decimal_value(value):
    if not value:
        return Decimal("0")

    try:
        cleaned = str(value).replace(",", "").strip()
        return Decimal(cleaned)
    except (InvalidOperation, ValueError):
        return Decimal("0")


def integer_value(value):
    if not value:
        return 1

    try:
        return int(float(value))
    except (ValueError, TypeError):
        return 1


class Command(BaseCommand):

    help = "Import Ananse transaction CSV and match orders to referral leads."

    def add_arguments(self, parser):
        parser.add_argument(
            "csv_file",
            type=str,
        )

    def handle(self, *args, **options):

        csv_file = options["csv_file"]

        imported = 0
        skipped = 0
        matched = 0
        unmatched = 0

        with open(
            csv_file,
            "r",
            encoding="utf-8-sig",
            newline="",
        ) as file:

            reader = csv.DictReader(file)

            for row in reader:

                external_id = str(
                    row.get("ID", "")
                ).strip()

                if not external_id:
                    self.stdout.write(
                        self.style.WARNING(
                            "Skipping row without ID"
                        )
                    )
                    skipped += 1
                    continue

                # --------------------------------------------------
                # Prevent duplicate imports
                # --------------------------------------------------

                if Order.objects.filter(
                    external_id=external_id
                ).exists():

                    skipped += 1

                    continue

                email = str(
                    row.get("Party Email", "")
                ).strip()

                phone = str(
                    row.get("Party Phone", "")
                ).strip()

                # --------------------------------------------------
                # Find referral lead
                # --------------------------------------------------

                lead, match_method = find_matching_lead(
                    email=email,
                    phone=phone,
                )

                if lead:
                    matched += 1
                else:
                    unmatched += 1

                # --------------------------------------------------
                # Create order
                # --------------------------------------------------

                Order.objects.create(
                    external_id=external_id,

                    reference=str(
                        row.get("Reference", "")
                    ).strip(),

                    status=str(
                        row.get("Status", "")
                    ).strip(),

                    customer_first_name=str(
                        row.get("Party First Name", "")
                    ).strip(),

                    customer_last_name=str(
                        row.get("Party Last Name", "")
                    ).strip(),

                    customer_email=email,

                    customer_phone=phone,

                    product_name=str(
                        row.get("Product Name", "")
                    ).strip(),

                    product_code=str(
                        row.get("Product Code", "")
                    ).strip(),

                    quantity=integer_value(
                        row.get("Item Quantity")
                    ),

                    subtotal=decimal_value(
                        row.get("Sub Total (Trans)")
                    ),

                    tax_amount=decimal_value(
                        row.get("Total Tax Amount (Trans)")
                    ),

                    total_amount=decimal_value(
                        row.get("Total Amount (Trans)")
                    ),

                    matched_lead=lead,

                    match_method=match_method,

                    raw_data=dict(row),
                )

                imported += 1

        self.stdout.write("")

        self.stdout.write(
            self.style.SUCCESS(
                f"Imported: {imported}"
            )
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Matched: {matched}"
            )
        )

        self.stdout.write(
            self.style.WARNING(
                f"Unmatched: {unmatched}"
            )
        )

        self.stdout.write(
            self.style.WARNING(
                f"Skipped: {skipped}"
            )
        )