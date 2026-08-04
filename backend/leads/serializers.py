from rest_framework import serializers

from common.phone import normalize_phone

from .models import Lead


class LeadCreateSerializer(serializers.ModelSerializer):

    class Meta:

        model = Lead

        fields = (
            "first_name",
            "last_name",
            "email",
            "phone",
            "interest",
            "inquiry_message",
        )

    def validate_email(self, value):

        return value.strip().lower()

    def validate_phone(self, value):

        return normalize_phone(value)