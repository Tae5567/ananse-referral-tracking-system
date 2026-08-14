from django.db.models import Q

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from referrals.models import Referral
from referrals.models import Visitor

from .models import Lead
from .serializers import LeadCreateSerializer


class LeadCreateAPIView(APIView):

    COOKIE_NAME = "visitor_id"

    def post(self, request):

        serializer = LeadCreateSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        referral = Referral.objects.get(
            code=request.data["referral_code"],
            active=True,
        )

        visitor = None

        visitor_cookie = request.COOKIES.get(
            self.COOKIE_NAME
        )

        if visitor_cookie:

            visitor = Visitor.objects.filter(
                visitor_id=visitor_cookie
            ).first()

        email = serializer.validated_data["email"]

        phone = serializer.validated_data["phone"]

        existing = Lead.objects.filter(
            Q(email=email) |
            Q(phone=phone)
        ).first()

        if existing:

            existing.referral = referral

            existing.visitor = visitor

            existing.save()

            return Response(

                {
                    "success": True,
                    "lead_id": existing.id,
                    "existing": True,
                }

            )

        lead = Lead.objects.create(

            referral=referral,

            visitor=visitor,

            **serializer.validated_data

        )

        return Response(

            {
                "success": True,
                "lead_id": lead.id,
                "existing": False,
            },

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
                {
                    "success": False,
                    "error": "Referral code is required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not inquiry_message:
            return Response(
                {
                    "success": False,
                    "error": "Inquiry message is required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            referral = Referral.objects.get(
                code=referral_code,
                active=True,
            )
        except Referral.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "error": "Invalid referral code.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        visitor = None

        visitor_cookie = request.COOKIES.get(
            self.COOKIE_NAME
        )

        if visitor_cookie:
            visitor = Visitor.objects.filter(
                visitor_id=visitor_cookie
            ).first()

        # Find the lead that was created when the visitor
        # completed the initial contact form.
        if visitor:
            lead = (
                Lead.objects
                .filter(
                    visitor=visitor,
                    referral=referral,
                )
                .order_by("-created_at")
                .first()
            )
        else:
            lead = None

        if not lead:
            return Response(
                {
                    "success": False,
                    "error": (
                        "Lead information could not be found. "
                        "Please return to the referral page and "
                        "complete your contact details first."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        lead.interest = Lead.Interest.CUSTOM_SERVICE
        lead.service_name = service_name
        lead.inquiry_message = inquiry_message
        lead.status = Lead.Status.NEW

        lead.save()

        return Response(
            {
                "success": True,
                "lead_id": lead.id,
            },
            status=status.HTTP_200_OK,
        )