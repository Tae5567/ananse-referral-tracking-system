from django.urls import path

from .views import ReferralLandingAPIView

urlpatterns = [

    path(

        "<slug:code>/",

        ReferralLandingAPIView.as_view(),

    )

]