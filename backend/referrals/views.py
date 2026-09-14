import uuid

from django.conf import settings

from django.http import Http404
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator

from rest_framework.response import Response
from rest_framework.views import APIView

from common.utils import get_client_ip

from .models import Referral
from .models import ReferralClick
from .models import Visitor

from.serializers import ReferralSerializer

# Create your views here.
@method_decorator(ensure_csrf_cookie, name="dispatch")
class ReferralLandingAPIView(APIView):
    """
    Called when React loads /r/<code>

    Creates visitor if necessary

    Logs click

    Returns referral details.
    """

    COOKIE_NAME = "visitor_id"

    def get(self, request, code):

        try:

            referral = Referral.objects.get(
                code=code,
                active=True,
            )

        except Referral.DoesNotExist:

            raise Http404

        visitor_id = request.COOKIES.get(
            self.COOKIE_NAME
        )

        visitor = None

        if visitor_id:

            visitor = Visitor.objects.filter(
                visitor_id=visitor_id
            ).first()

        if visitor is None:

            visitor = Visitor.objects.create(
                ip_address=get_client_ip(request),

                user_agent = request.headers.get(
                    "User-Agent",
                    "",
                ),
            )


        ReferralClick.objects.create(
            referral=referral,

            visitor=visitor,

            landing_page=f"/r/{code}",
        )

        response = Response(
            ReferralSerializer(referral).data
        )

        response.set_cookie(
            self.COOKIE_NAME,
            str(visitor.visitor_id),
            max_age=60 * 60 * 24 * 365,
            httponly=True,
            samesite="Lax" if settings.DEBUG else "None",
            secure=not settings.DEBUG,
        )

        return response