from rest_framework import serializers

from common.phone import normalize_phone

from .models import Lead


class LeadCreateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Lead
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "phone",
            "referral",
            "interest",
            "service_name",
            "inquiry_message",
            "status",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "referral",
            "status",
            "created_at",
        ]