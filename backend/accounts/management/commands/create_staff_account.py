from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError
from django.utils.text import slugify

from accounts.models import StaffProfile
from referrals.models import Referral


class Command(BaseCommand):
    help = "Create/update an internal staff account and its referral link."

    def add_arguments(self, parser):
        parser.add_argument("username")
        parser.add_argument("--first-name", default="")
        parser.add_argument("--last-name", default="")
        parser.add_argument("--email", default="")
        parser.add_argument(
            "--role",
            choices=[StaffProfile.Role.SALES_REP, StaffProfile.Role.MANAGER],
            default=StaffProfile.Role.SALES_REP,
        )
        parser.add_argument("--code", default="")
        parser.add_argument("--password", default="")

    def handle(self, *args, **options):
        username = options["username"].strip()
        if not username:
            raise CommandError("Username is required.")

        user, created = User.objects.get_or_create(username=username)
        user.first_name = options["first_name"].strip()
        user.last_name = options["last_name"].strip()
        user.email = options["email"].strip()
        user.is_active = True

        password = options["password"]
        if password:
            user.set_password(password)
        elif created:
            user.set_unusable_password()

        user.save()

        StaffProfile.objects.update_or_create(
            user=user,
            defaults={"role": options["role"], "active": True},
        )

        code = options["code"].strip() or slugify(
            user.get_full_name() or username
        )
        referral = Referral.objects.filter(code=code).first()
        if referral:
            referral.name = user.get_full_name() or username
            referral.source_type = Referral.SourceType.STAFF
            referral.owner = user
            referral.active = True
            referral.save()
        else:
            referral = Referral.objects.filter(
                owner=user,
                source_type=Referral.SourceType.STAFF,
            ).first()
            if referral:
                referral.name = user.get_full_name() or username
                referral.code = code
                referral.active = True
                referral.save()
            else:
                referral = Referral.objects.create(
                    owner=user,
                    source_type=Referral.SourceType.STAFF,
                    name=user.get_full_name() or username,
                    code=code,
                    active=True,
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"Staff account ready: {username} ({options['role']}) -> /r/{referral.code}"
            )
        )
