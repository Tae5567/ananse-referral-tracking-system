import json

from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_POST

from accounts.models import StaffProfile
from accounts.permissions import get_staff_profile, is_manager


def _user_payload(user):
    profile = get_staff_profile(user)
    role = profile.role if profile else None

    return {
        "username": user.username,
        "name": user.get_full_name() or user.username,
        "email": user.email,
        "role": role,
        "role_display": profile.get_role_display() if profile else None,
        "is_manager": is_manager(user),
    }


@csrf_protect
@require_POST
def login_view(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse(
            {"success": False, "error": "Invalid request."},
            status=400,
        )

    username = data.get("username")
    password = data.get("password")

    user = authenticate(request, username=username, password=password)

    if user is None:
        return JsonResponse(
            {"success": False, "error": "Invalid username or password."},
            status=401,
        )

    if not user.is_superuser:
        profile = getattr(user, "staff_profile", None)
        if not profile or not profile.active:
            return JsonResponse(
                {"success": False, "error": "This staff account is not active."},
                status=403,
            )

    login(request, user)

    return JsonResponse({
        "success": True,
        "user": _user_payload(user),
    })


@require_POST
def logout_view(request):
    logout(request)
    return JsonResponse({"success": True})


def me_view(request):
    if not request.user.is_authenticated:
        return JsonResponse(
            {"success": False, "authenticated": False},
            status=401,
        )

    return JsonResponse({
        "success": True,
        "authenticated": True,
        "user": _user_payload(request.user),
    })
