from ipaddress import ip_address


def get_client_ip(request):
    """
    Return the real client IP address.
    """

    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")

    if forwarded:
        return forwarded.split(",")[0].strip()

    return request.META.get("REMOTE_ADDR")