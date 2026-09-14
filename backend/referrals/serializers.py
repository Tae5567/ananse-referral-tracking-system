from rest_framework import serializers

from .models import Referral


class ReferralSerializer(serializers.ModelSerializer):
    class Meta:
        model = Referral
        fields = (
            "id",
            "name",
            "code",
            "source_type",
        )
