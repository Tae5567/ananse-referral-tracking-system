from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_POST


@csrf_protect
@require_POST
def login_view(request):

    import json

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse(
            {
                "success": False,
                "error": "Invalid request.",
            },
            status=400,
        )

    username = data.get("username")
    password = data.get("password")

    user = authenticate(
        request,
        username=username,
        password=password,
    )

    if user is None:
        return JsonResponse(
            {
                "success": False,
                "error": "Invalid username or password.",
            },
            status=401,
        )

    login(request, user)

    return JsonResponse({
        "success": True,
        "user": {
            "username": user.username,
            "name": user.get_full_name(),
        },
    })


def logout_view(request):

    logout(request)

    return JsonResponse({
        "success": True,
    })


def me_view(request):

    if not request.user.is_authenticated:
        return JsonResponse(
            {
                "success": False,
                "authenticated": False,
            },
            status=401,
        )

    return JsonResponse({
        "success": True,
        "authenticated": True,
        "user": {
            "username": request.user.username,
            "name": request.user.get_full_name(),
        },
    })