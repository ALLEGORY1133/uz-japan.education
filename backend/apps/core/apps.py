from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.core"

    def ready(self):
        from . import audit

        audit.connect()

        from django.db.models.signals import pre_save

        from .alphabet import normalize_instance

        def _alphabet(sender, instance, raw=False, **kw):
            if not raw:
                normalize_instance(instance)

        pre_save.connect(_alphabet, dispatch_uid="uz_new_alphabet")
