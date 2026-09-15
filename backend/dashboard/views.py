from decimal import Decimal

from django.db.models import Sum
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import is_manager
from leads.models import Lead
from referrals.models import Referral
from sales.models import CustomSale, Order


def _order_payload(order):
    return {
        "id": order.id,
        "external_id": order.external_id,
        "reference": order.reference,
        "customer_name": (
            f"{order.customer_first_name} {order.customer_last_name}"
        ).strip(),
        "email": order.customer_email,
        "phone": order.customer_phone,
        "service": order.product_name,
        "amount": str(order.total_amount),
        "status": order.status,
        "payment_status": order.payment_status,
        "archived": order.archived,
        "date": order.purchase_date or order.created_at,
        "match_method": order.match_method,
    }


def _website_activity_payload(order):
    return {
        "id": order.id,
        "customer_name": (
            f"{order.customer_first_name} {order.customer_last_name}"
        ).strip(),
        "service": order.product_name,
        "type": "Website",
        "amount": str(order.total_amount),
        "status": order.payment_status,
        "archived": order.archived,
        "date": order.purchase_date or order.created_at,
    }


def _custom_activity_payload(sale):
    return {
        "id": sale.id,
        "customer_name": (
            f"{sale.customer_first_name} {sale.customer_last_name}"
        ).strip(),
        "service": sale.service_name,
        "type": "Custom",
        "amount": str(sale.amount),
        "status": sale.status,
        "archived": sale.archived,
        "date": sale.sale_date or sale.created_at,
    }


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        referral = (
            Referral.objects.filter(
                owner=request.user,
                source_type=Referral.SourceType.STAFF,
                active=True,
            )
            .order_by("created_at")
            .first()
        )

        if not referral:
            return Response(
                {
                    "success": False,
                    "error": "No active staff referral link is assigned to this account.",
                    "user": {
                        "name": request.user.get_full_name() or request.user.username,
                        "username": request.user.username,
                        "is_manager": is_manager(request.user),
                    },
                },
                status=404,
            )

        clicks = referral.clicks.count()
        visitors = referral.clicks.values("visitor_id").distinct().count()
        leads = referral.leads.count()

        # Archiving is display-only. Archived paid sales still count in metrics/revenue.
        all_orders = Order.objects.filter(matched_lead__referral=referral)
        paid_orders = all_orders.filter(payment_status="paid")

        website_revenue = (
            paid_orders.aggregate(total=Sum("total_amount"))["total"]
            or Decimal("0")
        )
        website_orders = paid_orders.count()

        all_custom_sales = CustomSale.objects.filter(
            lead__referral=referral,
        )
        paid_custom_sales = all_custom_sales.filter(status="paid")

        custom_revenue = (
            paid_custom_sales.aggregate(total=Sum("amount"))["total"]
            or Decimal("0")
        )
        custom_sale_count = paid_custom_sales.count()

        total_revenue = website_revenue + custom_revenue
        total_conversions = website_orders + custom_sale_count

        lead_ids_with_orders = set(
            paid_orders.exclude(matched_lead_id=None).values_list(
                "matched_lead_id", flat=True
            )
        )
        lead_ids_with_custom_sales = set(
            paid_custom_sales.exclude(lead_id=None).values_list("lead_id", flat=True)
        )
        converted_lead_ids = lead_ids_with_orders | lead_ids_with_custom_sales

        conversion_rate = 0
        if leads:
            conversion_rate = round((len(converted_lead_ids) / leads) * 100, 2)

        # Website orders section: only the five most recent in each tab.
        active_orders_qs = (
            all_orders
            .filter(archived=False)
            .order_by("-purchase_date", "-created_at")[:5]
        )
        archived_orders_qs = (
            all_orders
            .filter(archived=True)
            .order_by("-purchase_date", "-created_at")[:5]
        )

        order_data = [_order_payload(order) for order in active_orders_qs]
        archived_order_data = [
            _order_payload(order) for order in archived_orders_qs
        ]

        # Recent activity: latest 10 across website + custom.
        active_activity = [
            _website_activity_payload(order)
            for order in all_orders.filter(archived=False).order_by(
                "-purchase_date", "-created_at"
            )[:10]
        ]
        active_activity.extend(
            _custom_activity_payload(sale)
            for sale in all_custom_sales.filter(archived=False).order_by(
                "-sale_date", "-created_at"
            )[:10]
        )
        active_activity.sort(
            key=lambda item: item["date"] or timezone.now(),
            reverse=True,
        )
        active_activity = active_activity[:10]

        archived_activity = [
            _website_activity_payload(order)
            for order in all_orders.filter(archived=True).order_by(
                "-purchase_date", "-created_at"
            )[:10]
        ]
        archived_activity.extend(
            _custom_activity_payload(sale)
            for sale in all_custom_sales.filter(archived=True).order_by(
                "-sale_date", "-created_at"
            )[:10]
        )
        archived_activity.sort(
            key=lambda item: item["date"] or timezone.now(),
            reverse=True,
        )
        archived_activity = archived_activity[:10]

        inquiry_queryset = (
            referral.leads.filter(interest=Lead.Interest.CUSTOM_SERVICE)
            .exclude(status__in=[Lead.Status.CONVERTED, Lead.Status.LOST])
            .order_by("-created_at")
        )

        inquiries = []
        for lead in inquiry_queryset[:20]:
            inquiries.append(
                {
                    "id": lead.id,
                    "first_name": lead.first_name,
                    "last_name": lead.last_name,
                    "email": lead.email,
                    "phone": lead.phone,
                    "service_name": lead.service_name,
                    "inquiry_message": lead.inquiry_message,
                    "status": lead.status,
                    "status_display": lead.get_status_display(),
                    "created_at": lead.created_at,
                }
            )

        return Response(
            {
                "success": True,
                "user": {
                    "name": request.user.get_full_name() or request.user.username,
                    "username": request.user.username,
                    "is_manager": is_manager(request.user),
                },
                "referral": {
                    "name": referral.name,
                    "code": referral.code,
                    "source_type": referral.source_type,
                },
                "stats": {
                    "clicks": clicks,
                    "unique_visitors": visitors,
                    "leads": leads,
                    "website_orders": website_orders,
                    "custom_sales": custom_sale_count,
                    "total_conversions": total_conversions,
                    "website_revenue": str(website_revenue),
                    "custom_revenue": str(custom_revenue),
                    "total_revenue": str(total_revenue),
                    "conversion_rate": conversion_rate,
                },
                "orders": order_data,
                "archived_orders": archived_order_data,
                "recent_activity": active_activity,
                "archived_activity": archived_activity,
                "inquiries": inquiries,
            }
        )
