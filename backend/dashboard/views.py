from decimal import Decimal

from django.db.models import Sum
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from referrals.models import Referral, Visitor
from sales.models import Order, CustomSale

from datetime import datetime
from django.utils import timezone

class DashboardView(APIView):

    permission_classes = [IsAuthenticated]
    
    def get(self, request):

        referral = Referral.objects.filter(
            code="camille",
            active=True,
        ).first()

        if not referral:
            return Response(
                {
                    "success": False,
                    "error": "Referral not found.",
                },
                status=404,
            )

        # -----------------------------
        # Referral activity
        # -----------------------------

        clicks = referral.clicks.count()

        visitors = referral.clicks.values("visitor_id").distinct().count()

        leads = referral.leads.count()

        # -----------------------------
        # Website orders
        # -----------------------------

        orders = Order.objects.filter(
            matched_lead__referral=referral
        )

        paid_orders = orders.filter(
            status="paid"
        )

        website_revenue = (
            paid_orders.aggregate(
                total=Sum("total_amount")
            )["total"]
            or Decimal("0")
        )

        website_orders = paid_orders.count()

        # -----------------------------
        # Custom sales
        # -----------------------------

        custom_sales = CustomSale.objects.filter(
            lead__referral=referral,
            status="paid",
        )

        custom_revenue = (
            custom_sales.aggregate(
                total=Sum("amount")
            )["total"]
            or Decimal("0")
        )

        custom_sale_count = custom_sales.count()

        # -----------------------------
        # Total revenue
        # -----------------------------

        total_revenue = (
            website_revenue +
            custom_revenue
        )

        total_conversions = (
            website_orders +
            custom_sale_count
        )

        # A lead is considered converted if they have at least
        # one website order or custom sale.

        lead_ids_with_orders = set(
            paid_orders
            .exclude(matched_lead_id=None)
            .values_list("matched_lead_id", flat=True)
        )

        lead_ids_with_custom_sales = set(
            custom_sales
            .exclude(lead_id=None)
            .values_list("lead_id", flat=True)
        )

        converted_lead_ids = (
            lead_ids_with_orders|
            lead_ids_with_custom_sales
        )


        # Conversion rate
        conversion_rate = 0

        if visitors:
            conversion_rate = round(
                (len(converted_lead_ids) / leads) * 100,
                2,
            )

        # -----------------------------
        # Recent website orders
        # -----------------------------

        recent_orders = []

        for order in orders.order_by(
            "-purchase_date",
            "-created_at",
        )[:10]:
            
            recent_orders.append({
                "id": order.id,
                "customer_name": (
                    f"{order.customer_first_name} "
                    f"{order.customer_last_name}"
                ).strip(),
                "service": order.product_name,
                "type": "Website",
                "amount": str(order.total_amount),
                "status": order.status,
                "date": order.purchase_date,
            })

        # -----------------------------
        # Recent custom sales
        # -----------------------------

        for sale in custom_sales.order_by(
            "-sale_date",
            "-created_at",
        )[:10]:

            recent_orders.append({
                "id": sale.id,
                "customer_name": (
                    f"{sale.customer_first_name} "
                    f"{sale.customer_last_name}"
                ).strip(),
                "service": sale.service_name,
                "type": "Custom",
                "amount": str(sale.amount),
                "status": sale.status,
                "date": sale.sale_date,
            })

        recent_orders.sort(
            key=lambda x: x["date"] or timezone.now(),
            reverse=True,
        )

        inquiry_queryset = (
            referral.leads
            .filter(
                interest="custom_service",
            )
            .exclude(
                status="converted",
            )
            .order_by("-created_at")
        )

        inquiries = []

        for lead in inquiry_queryset[:20]:
            inquiries.append({
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
            })


        order_data = []

        for order in orders.order_by(
            "-purchase_date",
            "-created_at",
        )[:50]:
            order_data.append({
                "id": order.id,
                "external_id": order.external_id,
                "reference": order.reference,
                "customer_name": (
                    f"{order.customer_first_name} "
                    f"{order.customer_last_name}"
                ).strip(),
                "email": order.customer_email,
                "phone": order.customer_phone,
                "service": order.product_name,
                "amount": str(order.total_amount),
                "status": order.status,
                "date": order.purchase_date or order.created_at,
                "match_method": order.match_method,
            })


        return Response({
            "success": True,

            "referral": {
                "name": referral.name,
                "code": referral.code,
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

            "recent_activity": recent_orders[:10],
            "orders": order_data,
            "inquiries": inquiries,
        })