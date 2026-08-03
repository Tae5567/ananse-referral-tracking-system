from django.core.management.base import BaseCommand

from referrals.models import Referral


class Command(BaseCommand):
    help = "Create the default referral for Camille"

    def handle(self, *args, **kwargs):
        referral, created = Referral.objects.get_or_create(
            code="camille",
            defaults={
                "name": "Camille",
                "active": True,
            },
        )

        if created:
            self.stdout.write(
                self.style.SUCCESS("Camille created successfully.")
            )
        else:
            self.stdout.write(
                self.style.WARNING("Camille already exists.")
            )