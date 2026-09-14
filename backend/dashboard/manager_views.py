from decimal import Decimal

from django.db.models import Sum
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import StaffProfile
from accounts.permissions import IsManager
from leads.models import Lead
from referrals.models import Referral
from sales.models import CustomSale, Order


def _referral_metrics(referral, include_revenue=True):
    clicks = referral.clicks.count()
    visitors = referral.clicks.values("visitor_id").distinct().count()
    leads = referral.leads.count()

    metrics = {
        "clicks": clicks,
        "unique_visitors": visitors,
        "leads": leads,
    }

    if include_revenue:
        paid_orders = Order.objects.filter(
            matched_lead__referral=referral,
            payment_status="paid",
        )
        paid_custom_sales = CustomSale.objects.filter(
            lead__referral=referral,
            status="paid",
        )
        website_revenue = (
            paid_orders.aggregate(total=Sum("total_amount"))["total"] or Decimal("0")
        )
        custom_revenue = (
            paid_custom_sales.aggregate(total=Sum("amount"))["total"] or Decimal("0")
        )
        metrics.update({
            "website_orders": paid_orders.count(),
            "custom_sales": paid_custom_sales.count(),
            "total_conversions": paid_orders.count() + paid_custom_sales.count(),
            "website_revenue": str(website_revenue),
            "custom_revenue": str(custom_revenue),
            "total_revenue": str(website_revenue + custom_revenue),
        })

    return metrics


class ManagerDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated, IsManager]

    def get(self, request):
        all_referrals = Referral.objects.filter(active=True)
        total_clicks = sum(ref.clicks.count() for ref in all_referrals)
        unique_visitors = (
            all_referrals.values("clicks__visitor_id")
            .exclude(clicks__visitor_id=None)
            .distinct()
            .count()
        )
        total_leads = Lead.objects.count()
        active_leads = Lead.objects.exclude(
            status__in=[Lead.Status.CONVERTED, Lead.Status.LOST]
        ).count()

        paid_orders = Order.objects.filter(payment_status="paid")
        paid_custom_sales = CustomSale.objects.filter(status="paid")
        website_revenue = (
            paid_orders.aggregate(total=Sum("total_amount"))["total"] or Decimal("0")
        )
        custom_revenue = (
            paid_custom_sales.aggregate(total=Sum("amount"))["total"] or Decimal("0")
        )

        staff_performance = []
        profiles = StaffProfile.objects.select_related("user").filter(active=True)
        for profile in profiles.order_by("user__first_name", "user__last_name", "user__username"):
            referral = (
                Referral.objects.filter(
                    owner=profile.user,
                    source_type=Referral.SourceType.STAFF,
                )
                .order_by("created_at")
                .first()
            )
            staff_performance.append({
                "id": profile.user_id,
                "name": profile.user.get_full_name() or profile.user.username,
                "username": profile.user.username,
                "role": profile.role,
                "referral": (
                    {"id": referral.id, "name": referral.name, "code": referral.code}
                    if referral
                    else None
                ),
                "metrics": _referral_metrics(referral) if referral else {
                    "clicks": 0,
                    "unique_visitors": 0,
                    "leads": 0,
                    "website_orders": 0,
                    "custom_sales": 0,
                    "total_conversions": 0,
                    "website_revenue": "0",
                    "custom_revenue": "0",
                    "total_revenue": "0",
                },
            })

        external_sources = []
        externals = Referral.objects.select_related("managed_by").filter(
            source_type__in=[Referral.SourceType.INFLUENCER, Referral.SourceType.PARTNER]
        ).order_by("-created_at")
        for referral in externals:
            external_sources.append({
                "id": referral.id,
                "name": referral.name,
                "code": referral.code,
                "source_type": referral.source_type,
                "active": referral.active,
                "managed_by": (
                    referral.managed_by.get_full_name() or referral.managed_by.username
                    if referral.managed_by
                    else None
                ),
                "metrics": _referral_metrics(referral, include_revenue=False),
            })

        recent_leads = []
        for lead in Lead.objects.select_related("referral", "assigned_to").order_by("-created_at")[:10]:
            recent_leads.append({
                "id": lead.id,
                "name": f"{lead.first_name} {lead.last_name}".strip(),
                "email": lead.email,
                "phone": lead.phone,
                "status": lead.status,
                "status_display": lead.get_status_display(),
                "source": lead.referral.name,
                "source_type": lead.referral.source_type,
                "assigned_to": (
                    lead.assigned_to.get_full_name() or lead.assigned_to.username
                    if lead.assigned_to
                    else None
                ),
                "created_at": lead.created_at,
            })

        return Response({
            "success": True,
            "stats": {
                "clicks": total_clicks,
                "unique_visitors": unique_visitors,
                "leads": total_leads,
                "active_leads": active_leads,
                "website_orders": paid_orders.count(),
                "custom_sales": paid_custom_sales.count(),
                "total_revenue": str(website_revenue + custom_revenue),
            },
            "staff_performance": staff_performance,
            "external_sources": external_sources,
            "recent_leads": recent_leads,
        })
