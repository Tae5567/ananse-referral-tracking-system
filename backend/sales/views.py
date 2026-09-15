import os
import tempfile

from django.core import management
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from leads.models import Lead
from leads.access import leads_for_user
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


class CustomSaleCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data.copy()

        email = data.get("customer_email", "").strip().lower()
        phone = data.get("customer_phone", "").strip()

        lead = None

        accessible_leads = leads_for_user(request.user)

        # If the frontend explicitly sends a lead ID, use that first.
        lead_id = data.get("lead")

        if lead_id:
            lead = accessible_leads.filter(id=lead_id).first()

            if not lead:
                return Response(
                    {
                        "success": False,
                        "error": "That lead is not available to this account.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Otherwise match by email.
        if not lead and email:
            lead = (
                accessible_leads
                .filter(email__iexact=email)
                .order_by("-created_at")
                .first()
            )

        # Then try phone.
        if not lead and phone:
            lead = (
                accessible_leads
                .filter(phone=phone)
                .order_by("-created_at")
                .first()
            )

        # A custom sale must have an attributed lead.
        if not lead:
            return Response(
                {
                    "success": False,
                    "error": (
                        "No matching lead was found for this customer. "
                        "Please make sure the email or phone number matches "
                        "an existing lead before recording the sale."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        data["lead"] = lead.id

        serializer = CustomSaleSerializer(data=data)

        if serializer.is_valid():
            sale = serializer.save()

            return Response(
                {
                    "success": True,
                    "sale": CustomSaleSerializer(sale).data,
                    "lead": {
                        "id": lead.id,
                        "name": (
                            f"{lead.first_name} {lead.last_name}"
                        ).strip(),
                        "referral_code": lead.referral.code,
                    },
                },
                status=status.HTTP_201_CREATED,
            )

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
        referral = _staff_referral_for_user(request.user)

        if not referral:
            return Response(
                {"success": False, "error": "No active staff referral found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        sale = get_object_or_404(
            CustomSale,
            id=sale_id,
            lead__referral=referral,
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