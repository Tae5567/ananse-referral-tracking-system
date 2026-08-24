import csv
from decimal import Decimal, InvalidOperation

from django.core.management.base import BaseCommand

from sales.models import Order
from sales.importer import import_orders_from_csv
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

        with open(
            csv_file,
            "rb",
        ) as file:

            result = import_orders_from_csv(file)

        self.stdout.write(
            self.style.SUCCESS(
                f"Imported: {result['imported']}"
            )
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Matched: {result['matched']}"
            )
        )

        self.stdout.write(
            self.style.WARNING(
                f"Unmatched: {result['unmatched']}"
            )
        )

        self.stdout.write(
            self.style.WARNING(
                f"Skipped: {result['skipped']}"
            )
        )  