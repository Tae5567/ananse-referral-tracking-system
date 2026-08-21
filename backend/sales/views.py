from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from leads.models import Lead

from .serializers import CustomSaleSerializer


class CustomSaleCreateView(APIView):

    def post(self, request):

        data = request.data.copy()

        email = data.get("customer_email", "").strip().lower()
        phone = data.get("customer_phone", "").strip()

        # Automatically connect the sale to an existing referral lead
        lead = None

        if email:
            lead = (
                Lead.objects
                .filter(email__iexact=email)
                .order_by("-created_at")
                .first()
            )

        if not lead and phone:
            lead = (
                Lead.objects
                .filter(phone=phone)
                .order_by("-created_at")
                .first()
            )

        if lead:
            data["lead"] = lead.id

        serializer = CustomSaleSerializer(data=data)

        if serializer.is_valid():
            sale = serializer.save()

            return Response(
                CustomSaleSerializer(sale).data,
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )