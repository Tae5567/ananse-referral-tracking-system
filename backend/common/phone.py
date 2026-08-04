import re


def normalize_phone(phone: str) -> str:
    """
    Normalize Nigerian phone numbers.

    Examples:

    08031234567
    +2348031234567
    2348031234567
    8031234567

    all become

    +2348031234567
    """

    if not phone:
        return ""

    phone = re.sub(r"\D", "", phone)

    if phone.startswith("0"):
        phone = "234" + phone[1:]

    elif phone.startswith("234"):
        pass

    elif len(phone) == 10:
        phone = "234" + phone

    return "+" + phone