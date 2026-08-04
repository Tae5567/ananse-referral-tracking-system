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