from math import ceil

from django.db.models import Case, IntegerField, Q, Value, When
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import is_manager
from referrals.models import Referral, Visitor

from .access import leads_for_user
from .models import Lead
from .serializers import LeadCreateSerializer


ARCHIVED_STATUSES = {Lead.Status.CONVERTED, Lead.Status.LOST}
DEFAULT_PAGE_SIZE = 25
MAX_PAGE_SIZE = 100


def _lead_payload(lead):
    assigned = lead.assigned_to
    owner = lead.referral.owner

    return {
        "id": lead.id,
        "first_name": lead.first_name,
        "last_name": lead.last_name,
        "email": lead.email,
        "phone": lead.phone,
        "interest": lead.interest,
        "interest_display": lead.get_interest_display() if lead.interest else "",
        "service_name": lead.service_name,
        "inquiry_message": lead.inquiry_message,
        "internal_notes": lead.internal_notes,
        "status": lead.status,
        "status_display": lead.get_status_display(),
        "created_at": lead.created_at,
        "updated_at": lead.updated_at,
        "referral": {
            "id": lead.referral_id,
            "name": lead.referral.name,
            "code": lead.referral.code,
            "source_type": lead.referral.source_type,
        },
        "source_owner": (
            {
                "id": owner.id,
                "name": owner.get_full_name() or owner.username,
                "username": owner.username,
            }
            if owner
            else None
        ),
        "assigned_to": (
            {
                "id": assigned.id,
                "name": assigned.get_full_name() or assigned.username,
                "username": assigned.username,
            }
            if assigned
            else None
        ),
    }


def _parse_positive_int(value, default, maximum=None):
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return default
    if parsed < 1:
        return default
    if maximum is not None:
        return min(parsed, maximum)
    return parsed


def _filter_and_paginate(request, queryset, *, include_interest_filter=False):
    archived = request.query_params.get("archived", "false").lower() == "true"
    search = request.query_params.get("search", "").strip()
    lead_status = request.query_params.get("status", "").strip()
    source = request.query_params.get("source", "").strip()
    assigned_to = request.query_params.get("assigned_to", "").strip()

    if archived:
        queryset = queryset.filter(status__in=ARCHIVED_STATUSES)
    else:
        queryset = queryset.exclude(status__in=ARCHIVED_STATUSES)

    if search:
        queryset = queryset.filter(
            Q(first_name__icontains=search)
            | Q(last_name__icontains=search)
            | Q(email__icontains=search)
            | Q(phone__icontains=search)
            | Q(service_name__icontains=search)
            | Q(inquiry_message__icontains=search)
            | Q(referral__name__icontains=search)
            | Q(referral__code__icontains=search)
        )

    if lead_status and lead_status in Lead.Status.values:
        queryset = queryset.filter(status=lead_status)

    if source:
        queryset = queryset.filter(referral__code=source)

    if assigned_to:
        if assigned_to == "unassigned":
            queryset = queryset.filter(assigned_to__isnull=True)
        else:
            try:
                queryset = queryset.filter(assigned_to_id=int(assigned_to))
            except ValueError:
                pass

    if include_interest_filter:
        queryset = queryset.filter(interest=Lead.Interest.CUSTOM_SERVICE)

    # Managers see their own sourced/assigned records first, then the wider team.
    if is_manager(request.user):
        queryset = queryset.annotate(
            _mine=Case(
                When(
                    Q(referral__owner=request.user) | Q(assigned_to=request.user),
                    then=Value(0),
                ),
                default=Value(1),
                output_field=IntegerField(),
            )
        ).order_by("_mine", "-updated_at", "-created_at")
    else:
        queryset = queryset.order_by("-updated_at", "-created_at")

    page = _parse_positive_int(request.query_params.get("page"), 1)
    page_size = _parse_positive_int(
        request.query_params.get("page_size"), DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE
    )

    total = queryset.count()
    total_pages = max(1, ceil(total / page_size)) if total else 1
    if page > total_pages:
        page = total_pages

    start = (page - 1) * page_size
    end = start + page_size
    records = list(queryset[start:end])

    return records, {
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages,
        "has_previous": page > 1,
        "has_next": page < total_pages,
        "archived": archived,
    }


class LeadCreateAPIView(APIView):
    COOKIE_NAME = "visitor_id"

    def post(self, request):
        serializer = LeadCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            referral = Referral.objects.get(
                code=request.data["referral_code"],
                active=True,
            )
        except Referral.DoesNotExist:
            return Response(
                {"success": False, "error": "Invalid referral code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        visitor = None
        visitor_cookie = request.COOKIES.get(self.COOKIE_NAME)
        if visitor_cookie:
            visitor = Visitor.objects.filter(visitor_id=visitor_cookie).first()

        email = serializer.validated_data["email"]
        phone = serializer.validated_data["phone"]

        # Dedupe only inside the same referral source. Never move an existing
        # customer's historical attribution from one rep/source to another.
        existing = (
            Lead.objects.filter(referral=referral)
            .filter(Q(email__iexact=email) | Q(phone=phone))
            .first()
        )

        default_assignee = referral.managed_by or referral.owner

        if existing:
            existing.visitor = visitor
            update_fields = ["visitor", "updated_at"]
            if not existing.assigned_to_id and default_assignee:
                existing.assigned_to = default_assignee
                update_fields.append("assigned_to")
            existing.save(update_fields=update_fields)

            return Response({
                "success": True,
                "lead_id": existing.id,
                "existing": True,
            })

        lead = Lead.objects.create(
            referral=referral,
            visitor=visitor,
            assigned_to=default_assignee,
            **serializer.validated_data,
        )

        return Response(
            {"success": True, "lead_id": lead.id, "existing": False},
            status=status.HTTP_201_CREATED,
        )


class InquiryCreateAPIView(APIView):
    COOKIE_NAME = "visitor_id"

    def post(self, request):
        referral_code = request.data.get("referral_code")
        service_name = request.data.get("service_name", "").strip()
        inquiry_message = request.data.get("inquiry_message", "").strip()

        if not referral_code:
            return Response(
                {"success": False, "error": "Referral code is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not inquiry_message:
            return Response(
                {"success": False, "error": "Inquiry message is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            referral = Referral.objects.get(code=referral_code, active=True)
        except Referral.DoesNotExist:
            return Response(
                {"success": False, "error": "Invalid referral code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        visitor = None
        visitor_cookie = request.COOKIES.get(self.COOKIE_NAME)
        if visitor_cookie:
            visitor = Visitor.objects.filter(visitor_id=visitor_cookie).first()

        lead = None
        if visitor:
            lead = (
                Lead.objects.filter(visitor=visitor, referral=referral)
                .order_by("-created_at")
                .first()
            )

        if not lead:
            return Response(
                {
                    "success": False,
                    "error": (
                        "Lead information could not be found. Please return to "
                        "the referral page and complete your contact details first."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        lead.interest = Lead.Interest.CUSTOM_SERVICE
        lead.service_name = service_name
        lead.inquiry_message = inquiry_message
        lead.status = Lead.Status.NEW
        if not lead.assigned_to_id:
            lead.assigned_to = referral.managed_by or referral.owner
        lead.save()

        return Response(
            {"success": True, "lead_id": lead.id},
            status=status.HTTP_200_OK,
        )


class LeadListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = leads_for_user(request.user)
        records, pagination = _filter_and_paginate(request, queryset)

        return Response({
            "success": True,
            "leads": [_lead_payload(lead) for lead in records],
            "pagination": pagination,
        })


class LeadDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, lead_id):
        lead = get_object_or_404(leads_for_user(request.user), id=lead_id)
        return Response({"success": True, "lead": _lead_payload(lead)})


class LeadUpdateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    VALID_STATUSES = set(Lead.Status.values)

    def patch(self, request, lead_id):
        lead = get_object_or_404(leads_for_user(request.user), id=lead_id)

        new_status = request.data.get("status")
        internal_notes = request.data.get("internal_notes")
        has_assignment = "assigned_to_id" in request.data
        assigned_to_id = request.data.get("assigned_to_id")

        update_fields = []

        if new_status is not None:
            if new_status not in self.VALID_STATUSES:
                return Response(
                    {"success": False, "error": "Invalid lead status."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            lead.status = new_status
            update_fields.append("status")

        if internal_notes is not None:
            lead.internal_notes = str(internal_notes)
            update_fields.append("internal_notes")

        if has_assignment:
            if not is_manager(request.user):
                return Response(
                    {"success": False, "error": "Only managers can reassign leads."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            if assigned_to_id in (None, ""):
                lead.assigned_to = None
            else:
                from django.contrib.auth.models import User
                lead.assigned_to = get_object_or_404(
                    User, id=assigned_to_id, is_active=True
                )
            update_fields.append("assigned_to")

        if update_fields:
            update_fields.append("updated_at")
            lead.save(update_fields=update_fields)

        return Response({"success": True, "lead": _lead_payload(lead)})


class InquiryListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = leads_for_user(request.user)
        records, pagination = _filter_and_paginate(
            request, queryset, include_interest_filter=True
        )

        return Response({
            "success": True,
            "inquiries": [_lead_payload(lead) for lead in records],
            "pagination": pagination,
        })


class InquiryStatusUpdateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    VALID_STATUSES = set(Lead.Status.values)

    def patch(self, request, inquiry_id):
        lead = get_object_or_404(
            leads_for_user(request.user),
            id=inquiry_id,
            interest=Lead.Interest.CUSTOM_SERVICE,
        )

        new_status = request.data.get("status")
        if new_status not in self.VALID_STATUSES:
            return Response(
                {"success": False, "error": "Invalid inquiry status."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        lead.status = new_status
        lead.save(update_fields=["status", "updated_at"])

        return Response({
            "success": True,
            "inquiry": _lead_payload(lead),
        })