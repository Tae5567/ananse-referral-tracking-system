from rest_framework import serializers

from sales.models import Order, CustomSale


class OrderDashboardSerializer(serializers.ModelSerializer):
    type = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    service = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "customer_name",
            "service",
            "type",
            "total_amount",
            "status",
            "purchase_date",
        ]

    def get_type(self, obj):
        return "Website"

    def get_customer_name(self, obj):
        return (
            f"{obj.customer_first_name} "
            f"{obj.customer_last_name}"
        ).strip()

    def get_service(self, obj):
        return obj.product_name


class CustomSaleDashboardSerializer(serializers.ModelSerializer):
    type = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    service = serializers.SerializerMethodField()

    class Meta:
        model = CustomSale
        fields = [
            "id",
            "customer_name",
            "service",
            "type",
            "amount",
            "status",
            "sale_date",
        ]

    def get_type(self, obj):
        return "Custom"

    def get_customer_name(self, obj):
        return (
            f"{obj.customer_first_name} "
            f"{obj.customer_last_name}"
        ).strip()

    def get_service(self, obj):
        return obj.service_name