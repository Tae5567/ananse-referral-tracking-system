import csv
from decimal import Decimal, InvalidOperation

from .models import Order
from .matching import find_matching_lead


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


def import_orders_from_csv(csv_file):
    imported = 0
    skipped = 0
    matched = 0
    unmatched = 0

    reader = csv.DictReader(
        csv_file.read().decode("utf-8-sig").splitlines()
    )

    for row in reader:

        external_id = str(
            row.get("ID", "")
        ).strip()

        if not external_id:
            skipped += 1
            continue

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

        lead, match_method = find_matching_lead(
            email=email,
            phone=phone,
        )

        if lead:
            matched += 1
        else:
            unmatched += 1

        Order.objects.create(
            external_id=external_id,

            reference=str(
                row.get("Reference", "")
            ).strip(),

            status="pending",
            
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

            # New transactions require confirmation.
            payment_status="pending",
        )

        imported += 1

    return {
        "imported": imported,
        "matched": matched,
        "unmatched": unmatched,
        "skipped": skipped,
    }