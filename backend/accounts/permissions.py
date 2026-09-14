from rest_framework.permissions import BasePermission

from .models import StaffProfile


def get_staff_profile(user):
    if not user or not user.is_authenticated:
        return None
    return getattr(user, "staff_profile", None)


def is_manager(user):
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    profile = get_staff_profile(user)
    return bool(
        profile
        and profile.active
        and profile.role == StaffProfile.Role.MANAGER
    )


def is_internal_staff(user):
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    profile = get_staff_profile(user)
    return bool(profile and profile.active)


class IsManager(BasePermission):
    message = "Manager access is required."

    def has_permission(self, request, view):
        return is_manager(request.user)
