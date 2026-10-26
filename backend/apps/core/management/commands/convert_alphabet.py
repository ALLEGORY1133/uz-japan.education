"""Bazadagi o'zbekcha (*_uz) matnlarni yangi alifboga o'tkazadi: python manage.py convert_alphabet [--dry-run]"""
from django.apps import apps
from django.core.management.base import BaseCommand
from django.db import models

from apps.core.alphabet import to_new_alphabet

SKIP_APPS = {"applications", "accounts"}  # foydalanuvchi kiritgan ma'lumotlarga tegmaymiz


class Command(BaseCommand):
    help = "Bazadagi *_uz matn maydonlarini yangi o'zbek alifbosiga o'tkazadi (qayta ishga tushirsa ham xavfsiz)."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **opts):
        total = 0
        for model in apps.get_models():
            if model._meta.app_label in SKIP_APPS:
                continue
            fields = [f.name for f in model._meta.get_fields()
                      if isinstance(f, (models.CharField, models.TextField)) and f.name.endswith("_uz")]
            if not fields:
                continue
            for obj in model.objects.all():
                changed = []
                for name in fields:
                    old = getattr(obj, name)
                    if old:
                        new = to_new_alphabet(old)
                        if new != old:
                            setattr(obj, name, new)
                            changed.append(name)
                if changed:
                    total += 1
                    if not opts["dry_run"]:
                        obj.save(update_fields=changed)
        self.stdout.write(self.style.SUCCESS(f"{total} ta yozuv {'o\'zgartiriladi' if opts['dry_run'] else 'yangilandi'}."))
