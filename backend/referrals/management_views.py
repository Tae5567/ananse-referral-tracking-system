from django.contrib.auth.models import User
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsManager

from .models import Referral


EXTERNAL_TYPES = {
    Referral.SourceType.INFLUENCER,
    Referral.SourceType.PARTNER,
}


def _referral_payload(referral):
    manager = referral.managed_by
    parent = referral.parent
    clicks = referral.clicks.count()
    unique_visitors = referral.clicks.values("visitor_id").distinct().count()
    leads = referral.leads.count()
    return {
        "id": referral.id,
        "name": referral.name,
        "code": referral.code,
        "source_type": referral.source_type,
        "source_type_display": referral.get_source_type_display(),
        "active": referral.active,
        "managed_by": (
            {
                "id": manager.id,
                "name": manager.get_full_name() or manager.username,
                "username": manager.username,
            }
            if manager
            else None
        ),
        "parent": (
            {"id": parent.id, "name": parent.name, "code": parent.code}
            if parent
            else None
        ),
        "metrics": {
            "clicks": clicks,
            "unique_visitors": unique_visitors,
            "leads": leads,
        },
        "created_at": referral.created_at,
    }


class ManagedReferralListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated, IsManager]

    def get(self, request):
        referrals = (
            Referral.objects.select_related("managed_by", "parent")
            .filter(source_type__in=EXTERNAL_TYPES)
            .order_by("-created_at")
        )
        return Response({
            "success": True,
            "referrals": [_referral_payload(referral) for referral in referrals],
        })

    @transaction.atomic
    def post(self, request):
        name = str(request.data.get("name", "")).strip()
        code = str(request.data.get("code", "")).strip().lower()
        source_type = request.data.get("source_type")
        managed_by_id = request.data.get("managed_by_id")

        if not name or not code:
            return Response(
                {"success": False, "error": "Name and referral code are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if source_type not in EXTERNAL_TYPES:
            return Response(
                {"success": False, "error": "Source type must be influencer or partner."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if Referral.objects.filter(code=code).exists():
            return Response(
                {"success": False, "error": "That referral code already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        managed_by = None
        if managed_by_id:
            managed_by = get_object_or_404(User, id=managed_by_id, is_active=True)

        referral = Referral.objects.create(
            name=name,
            code=code,
            source_type=source_type,
            managed_by=managed_by,
            active=True,
        )
        return Response(
            {"success": True, "referral": _referral_payload(referral)},
            status=status.HTTP_201_CREATED,
        )


class ManagedReferralDetailAPIView(APIView):
    permission_classes = [IsAuthenticated, IsManager]

    def patch(self, request, referral_id):
        referral = get_object_or_404(
            Referral,
            id=referral_id,
            source_type__in=EXTERNAL_TYPES,
        )

        if "name" in request.data:
            referral.name = str(request.data.get("name", "")).strip() or referral.name
        if "code" in request.data:
            new_code = str(request.data.get("code", "")).strip().lower()
            if not new_code:
                return Response(
                    {"success": False, "error": "Referral code cannot be blank."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if Referral.objects.exclude(id=referral.id).filter(code=new_code).exists():
                return Response(
                    {"success": False, "error": "That referral code already exists."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            referral.code = new_code
        if "active" in request.data:
            referral.active = bool(request.data.get("active"))
        if "managed_by_id" in request.data:
            manager_id = request.data.get("managed_by_id")
            referral.managed_by = (
                get_object_or_404(User, id=manager_id, is_active=True)
                if manager_id
                else None
            )

        referral.save()
        return Response({"success": True, "referral": _referral_payload(referral)})
