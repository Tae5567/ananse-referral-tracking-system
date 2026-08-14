import re


def normalize_phone(phone):
    """
    Normalize Nigerian phone numbers to:
    234XXXXXXXXXX
    """

    if not phone:
        return ""

    phone = str(phone).strip()

    # Keep numbers only
    digits = re.sub(r"\D", "", phone)

    if not digits:
        return ""

    # 08149572355 -> 2348149572355
    if digits.startswith("0") and len(digits) == 11:
        return "234" + digits[1:]

    # 8149572355 -> 2348149572355
    if len(digits) == 10:
        return "234" + digits

    # 2348149572355
    if digits.startswith("234") and len(digits) == 13:
        return digits

    return digits