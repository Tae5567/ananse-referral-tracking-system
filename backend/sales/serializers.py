from rest_framework import serializers

from .models import CustomSale


class CustomSaleSerializer(serializers.ModelSerializer):

    class Meta:
        model = CustomSale
        fields = [
            "id",
            "lead",
            "customer_first_name",
            "customer_last_name",
            "customer_email",
            "customer_phone",
            "service_name",
            "amount",
            "payment_method",
            "status",
            "notes",
            "sale_date",
        ]