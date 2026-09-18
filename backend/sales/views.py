import os
import tempfile
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

from django.core import management
from django.db.models import Q
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import is_manager
from leads.access import leads_for_user
from leads.models import Lead
from referrals.models import Referral

from .models import CustomSale, Order
from .serializers import CustomSaleSerializer


def _staff_referral_for_user(user):
    return (
        Referral.objects.filter(
            owner=user,
            source_type=Referral.SourceType.STAFF,
            active=True,
        )
        .order_by("created_at")
        .first()
    )


def _referral_sources_for_user(user):
    """
    Managers can attribute a manual/custom sale to any active referral source.
    Normal staff can use their own referral and any external source they manage.
    """
    queryset = Referral.objects.filter(active=True)

    if is_manager(user):
        return queryset.order_by("name", "code")

    return (
        queryset
        .filter(
            Q(owner=user) |
            Q(managed_by=user)
        )
        .distinct()
        .order_by("name", "code")
    )


class CustomSaleSourceOptionsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        referrals = _referral_sources_for_user(request.user)

        return Response({
            "success": True,
            "sources": [
                {
                    "id": referral.id,
                    "name": referral.name,
                    "code": referral.code,
                    "source_type": referral.source_type,
                    "source_type_display": referral.get_source_type_display(),
                }
                for referral in referrals
            ],
            "pricing": {
                "tax_rate": str(CustomSale.TAX_RATE),
                "facilities": [
                    {
                        "value": value,
                        "label": label,
                        "security_deposit": str(
                            CustomSale.SECURITY_DEPOSIT_BY_FACILITY.get(
                                value,
                                Decimal("0.00"),
                            )
                        ),
                    }
                    for value, label in CustomSale.FACILITY_CHOICES
                ],
            },
        })


class CustomSaleCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data.copy()

        email = data.get("customer_email", "").strip().lower()
        phone = data.get("customer_phone", "").strip()
        first_name = data.get("customer_first_name", "").strip()
        last_name = data.get("customer_last_name", "").strip()
        service_name = data.get("service_name", "").strip()
        facility_type = data.get("facility_type", "").strip()

        try:
            service_amount = Decimal(str(data.get("amount", "0")))
        except (InvalidOperation, TypeError, ValueError):
            service_amount = Decimal("0")

        if service_amount <= 0:
            return Response(
                {
                    "success": False,
                    "error": "Service value must be greater than zero.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        valid_facilities = {
            value
            for value, _label in CustomSale.FACILITY_CHOICES
        }

        if facility_type not in valid_facilities:
            return Response(
                {
                    "success": False,
                    "error": "Invalid facility/security deposit option.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        tax_amount = (
            service_amount * CustomSale.TAX_RATE
        ).quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP,
        )

        security_deposit = (
            CustomSale.SECURITY_DEPOSIT_BY_FACILITY.get(
                facility_type,
                Decimal("0.00"),
            )
        )

        total_paid = (
            service_amount +
            tax_amount +
            security_deposit
        ).quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP,
        )

        lead = None

        # ---------------------------------------------------------
        # 1. Resolve the referral/source that should get attribution.
        # ---------------------------------------------------------
        source_id = data.pop("referral_source_id", None)

        source = None

        if source_id:
            source = (
                _referral_sources_for_user(request.user)
                .filter(id=source_id)
                .first()
            )

            if not source:
                return Response(
                    {
                        "success": False,
                        "error": "That sales source is not available to this account.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            # Default to the logged-in staff member's own referral.
            source = _staff_referral_for_user(request.user)

        if not source:
            return Response(
                {
                    "success": False,
                    "error": (
                        "Please choose a sales source before recording this sale."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ---------------------------------------------------------
        # 2. If a specific lead was supplied, use it if accessible.
        # ---------------------------------------------------------
        accessible_leads = leads_for_user(request.user)
        lead_id = data.get("lead")

        if lead_id:
            lead = accessible_leads.filter(
                id=lead_id,
                referral=source,
            ).first()

            if not lead:
                return Response(
                    {
                        "success": False,
                        "error": (
                            "That lead is not available for the selected sales source."
                        ),
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # ---------------------------------------------------------
        # 3. Otherwise try to match an existing lead under this source.
        # ---------------------------------------------------------
        if not lead and email:
            lead = (
                accessible_leads
                .filter(
                    referral=source,
                    email__iexact=email,
                )
                .order_by("-created_at")
                .first()
            )

        if not lead and phone:
            lead = (
                accessible_leads
                .filter(
                    referral=source,
                    phone=phone,
                )
                .order_by("-created_at")
                .first()
            )

        # ---------------------------------------------------------
        # 4. No lead exists: create one automatically.
        #
        # This lets staff record walk-ins, WhatsApp customers,
        # existing clients, corporate contacts, etc. without first
        # forcing the customer through the public referral form.
        # ---------------------------------------------------------
        if not lead:
            lead = Lead.objects.create(
                referral=source,
                assigned_to=request.user,
                first_name=first_name or "Customer",
                last_name=last_name,
                email=email,
                phone=phone,
                interest=Lead.Interest.CUSTOM_SERVICE,
                service_name=service_name,
                inquiry_message="",
                status=Lead.Status.CONVERTED,
            )

        # A completed custom sale means the lead has converted.
        if lead.status != Lead.Status.CONVERTED:
            lead.status = Lead.Status.CONVERTED

            if not lead.assigned_to_id:
                lead.assigned_to = request.user

            update_fields = ["status", "updated_at"]

            if lead.assigned_to_id == request.user.id:
                update_fields.append("assigned_to")

            lead.save(update_fields=list(dict.fromkeys(update_fields)))

        data["lead"] = lead.id
        data["facility_type"] = facility_type

        serializer = CustomSaleSerializer(data=data)

        if serializer.is_valid():
            sale = serializer.save(
                tax_amount=tax_amount,
                security_deposit=security_deposit,
                total_paid=total_paid,
            )

            return Response(
                {
                    "success": True,
                    "sale": CustomSaleSerializer(sale).data,
                    "financials": {
                        "service_value": str(service_amount),
                        "tax_amount": str(tax_amount),
                        "security_deposit": str(security_deposit),
                        "total_paid": str(total_paid),
                        "revenue_amount": str(service_amount),
                    },
                    "lead": {
                        "id": lead.id,
                        "name": (
                            f"{lead.first_name} {lead.last_name}"
                        ).strip(),
                        "referral_id": source.id,
                        "referral_name": source.name,
                        "referral_code": source.code,
                        "created_automatically": lead_id is None,
                    },
                },
                status=status.HTTP_201_CREATED,
            )

        # If the serializer fails and we just created a new lead,
        # leave the lead in place rather than deleting business data.
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


class OrderPaymentStatusAPIView(APIView):
    permission_classes = [IsAuthenticated]

    VALID_STATUSES = {
        "pending",
        "paid",
        "not_paid",
        "failed",
        "cancelled",
        "refunded",
    }

    def patch(self, request, order_id):
        referral = _staff_referral_for_user(request.user)

        if not referral:
            return Response(
                {"success": False, "error": "No active staff referral found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        order = get_object_or_404(
            Order,
            id=order_id,
            matched_lead__referral=referral,
        )

        payment_status = request.data.get("payment_status")

        if payment_status not in self.VALID_STATUSES:
            return Response(
                {
                    "success": False,
                    "error": "Invalid payment status.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        order.payment_status = payment_status
        order.save(update_fields=["payment_status", "updated_at"])

        return Response({
            "success": True,
            "order": {
                "id": order.id,
                "payment_status": order.payment_status,
            },
        })


class OrderArchiveAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, order_id):
        referral = _staff_referral_for_user(request.user)

        if not referral:
            return Response(
                {"success": False, "error": "No active staff referral found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        order = get_object_or_404(
            Order,
            id=order_id,
            matched_lead__referral=referral,
        )

        archived = request.data.get("archived")

        if not isinstance(archived, bool):
            return Response(
                {"success": False, "error": "archived must be true or false."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order.archived = archived
        order.save(update_fields=["archived", "updated_at"])

        return Response({
            "success": True,
            "order": {
                "id": order.id,
                "archived": order.archived,
            },
        })


class CustomSaleArchiveAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, sale_id):
        sale = (
            CustomSale.objects
            .filter(id=sale_id)
            .filter(
                Q(lead__referral__owner=request.user) |
                Q(lead__referral__managed_by=request.user)
            )
            .first()
        )

        if is_manager(request.user):
            sale = CustomSale.objects.filter(id=sale_id).first()

        if not sale:
            return Response(
                {"success": False, "error": "Custom sale not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        archived = request.data.get("archived")

        if not isinstance(archived, bool):
            return Response(
                {"success": False, "error": "archived must be true or false."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        sale.archived = archived
        sale.save(update_fields=["archived", "updated_at"])

        return Response({
            "success": True,
            "sale": {
                "id": sale.id,
                "archived": sale.archived,
            },
        })


class OrderCSVImportAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        csv_file = request.FILES.get("file")

        if not csv_file:
            return Response(
                {
                    "success": False,
                    "error": "Please upload a CSV file.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not csv_file.name.lower().endswith(".csv"):
            return Response(
                {
                    "success": False,
                    "error": "Only CSV files are accepted.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if csv_file.size > 10 * 1024 * 1024:
            return Response(
                {
                    "success": False,
                    "error": "CSV file is too large. Maximum size is 10MB.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        temp_path = None

        try:
            with tempfile.NamedTemporaryFile(
                delete=False,
                suffix=".csv",
            ) as temp_file:
                for chunk in csv_file.chunks():
                    temp_file.write(chunk)

                temp_path = temp_file.name

            before_count = Order.objects.count()

            management.call_command(
                "import_orders",
                temp_path,
                stdout=None,
            )

            after_count = Order.objects.count()
            imported = after_count - before_count

            return Response(
                {
                    "success": True,
                    "imported": imported,
                    "message": (
                        f"{imported} new transaction"
                        f"{'s' if imported != 1 else ''} imported."
                    ),
                },
                status=status.HTTP_200_OK,
            )

        except Exception as exc:
            return Response(
                {
                    "success": False,
                    "error": str(exc),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        finally:
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)


class OrderStatusUpdateAPIView(APIView):
    """
    Legacy endpoint retained for compatibility.
    New UI should use /payment-status/.
    """

    permission_classes = [IsAuthenticated]

    VALID_STATUSES = {
        "pending",
        "paid",
        "not_paid",
    }

    def patch(self, request, order_id):
        try:
            order = Order.objects.get(id=order_id)

        except Order.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "error": "Order not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        new_status = request.data.get("status")

        if new_status not in self.VALID_STATUSES:
            return Response(
                {
                    "success": False,
                    "error": (
                        "Status must be pending, paid, "
                        "or not_paid."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        order.status = new_status
        order.save(update_fields=["status", "updated_at"])

        return Response(
            {
                "success": True,
                "order": {
                    "id": order.id,
                    "status": order.status,
                },
            }
        )
