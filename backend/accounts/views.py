from django.contrib.auth.models import User
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils.text import slugify
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from referrals.models import Referral

from .models import StaffProfile
from .permissions import IsManager


def _staff_payload(profile):
    user = profile.user
    referral = (
        Referral.objects.filter(
            owner=user,
            source_type=Referral.SourceType.STAFF,
        )
        .order_by("created_at")
        .first()
    )
    return {
        "id": user.id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "name": user.get_full_name() or user.username,
        "email": user.email,
        "role": profile.role,
        "role_display": profile.get_role_display(),
        "active": profile.active and user.is_active,
        "referral": (
            {
                "id": referral.id,
                "name": referral.name,
                "code": referral.code,
                "active": referral.active,
            }
            if referral
            else None
        ),
    }


class StaffListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated, IsManager]

    def get(self, request):
        profiles = StaffProfile.objects.select_related("user").order_by(
            "user__first_name", "user__last_name", "user__username"
        )
        return Response({
            "success": True,
            "staff": [_staff_payload(profile) for profile in profiles],
        })

    @transaction.atomic
    def post(self, request):
        username = str(request.data.get("username", "")).strip().lower()
        first_name = str(request.data.get("first_name", "")).strip()
        last_name = str(request.data.get("last_name", "")).strip()
        email = str(request.data.get("email", "")).strip().lower()
        role = request.data.get("role", StaffProfile.Role.SALES_REP)
        password = str(request.data.get("password", ""))
        referral_code = str(request.data.get("referral_code", "")).strip().lower()
        referral_name = str(request.data.get("referral_name", "")).strip()

        if not username:
            return Response(
                {"success": False, "error": "Username is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if role not in StaffProfile.Role.values:
            return Response(
                {"success": False, "error": "Invalid staff role."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if User.objects.filter(username__iexact=username).exists():
            return Response(
                {"success": False, "error": "That username already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not referral_code:
            referral_code = slugify(username)
        if not referral_code:
            return Response(
                {"success": False, "error": "A valid referral code is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if Referral.objects.filter(code=referral_code).exists():
            return Response(
                {"success": False, "error": "That referral code already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password or None,
            first_name=first_name,
            last_name=last_name,
        )
        if not password:
            user.set_unusable_password()
            user.save(update_fields=["password"])

        profile = StaffProfile.objects.create(user=user, role=role, active=True)

        Referral.objects.create(
            name=referral_name or user.get_full_name() or username,
            code=referral_code,
            source_type=Referral.SourceType.STAFF,
            owner=user,
            managed_by=user,
            active=True,
        )

        return Response(
            {"success": True, "staff": _staff_payload(profile)},
            status=status.HTTP_201_CREATED,
        )


class StaffDetailAPIView(APIView):
    permission_classes = [IsAuthenticated, IsManager]

    @transaction.atomic
    def patch(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        profile = get_object_or_404(StaffProfile, user=user)

        if "first_name" in request.data:
            user.first_name = str(request.data.get("first_name", "")).strip()
        if "last_name" in request.data:
            user.last_name = str(request.data.get("last_name", "")).strip()
        if "email" in request.data:
            user.email = str(request.data.get("email", "")).strip().lower()

        if "role" in request.data:
            role = request.data.get("role")
            if role not in StaffProfile.Role.values:
                return Response(
                    {"success": False, "error": "Invalid staff role."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if (
                profile.role == StaffProfile.Role.MANAGER
                and role != StaffProfile.Role.MANAGER
                and StaffProfile.objects.filter(
                    role=StaffProfile.Role.MANAGER,
                    active=True,
                    user__is_active=True,
                ).exclude(user=user).count() == 0
            ):
                return Response(
                    {"success": False, "error": "You cannot remove the last active manager."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            profile.role = role

        if "active" in request.data:
            active = bool(request.data.get("active"))
            if request.user.id == user.id and not active:
                return Response(
                    {"success": False, "error": "You cannot deactivate your own account."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if (
                not active
                and profile.role == StaffProfile.Role.MANAGER
                and StaffProfile.objects.filter(
                    role=StaffProfile.Role.MANAGER,
                    active=True,
                    user__is_active=True,
                ).exclude(user=user).count() == 0
            ):
                return Response(
                    {"success": False, "error": "You cannot deactivate the last active manager."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            profile.active = active
            user.is_active = active

        user.save()
        profile.save()

        referral = (
            Referral.objects.filter(
                owner=user,
                source_type=Referral.SourceType.STAFF,
            )
            .order_by("created_at")
            .first()
        )
        if referral:
            if "referral_name" in request.data:
                referral.name = str(request.data.get("referral_name", "")).strip() or referral.name
            if "referral_code" in request.data:
                new_code = str(request.data.get("referral_code", "")).strip().lower()
                if not new_code:
                    return Response(
                        {"success": False, "error": "Referral code cannot be blank."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                if Referral.objects.exclude(id=referral.id).filter(code=new_code).exists():
                    return Response(
                        {"success": False, "error": "That referral code already exists."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                referral.code = new_code
            referral.active = profile.active
            referral.save()

        return Response({"success": True, "staff": _staff_payload(profile)})

    @transaction.atomic
    def delete(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        profile = get_object_or_404(StaffProfile, user=user)

        if request.user.id == user.id:
            return Response(
                {"success": False, "error": "You cannot delete your own account."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if profile.role == StaffProfile.Role.MANAGER:
            remaining_managers = StaffProfile.objects.filter(
                role=StaffProfile.Role.MANAGER,
                active=True,
                user__is_active=True,
            ).exclude(user=user).count()
            if remaining_managers == 0:
                return Response(
                    {"success": False, "error": "You cannot delete the last active manager."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Keep the referral row and all historical leads/clicks/sales attribution.
        # User FKs are SET_NULL, so deleting the login does not erase history.
        Referral.objects.filter(
            owner=user,
            source_type=Referral.SourceType.STAFF,
        ).update(active=False)

        deleted_name = user.get_full_name() or user.username
        user.delete()

        return Response({
            "success": True,
            "message": f"{deleted_name} was removed. Historical referral data was preserved.",
        })


class StaffOptionsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profiles = (
            StaffProfile.objects.select_related("user")
            .filter(active=True, user__is_active=True)
            .order_by("user__first_name", "user__last_name", "user__username")
        )
        return Response({
            "success": True,
            "staff": [
                {
                    "id": profile.user_id,
                    "name": profile.user.get_full_name() or profile.user.username,
                    "username": profile.user.username,
                    "role": profile.role,
                }
                for profile in profiles
            ],
        })