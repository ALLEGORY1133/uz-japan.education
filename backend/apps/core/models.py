from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    """Admin panelda bajarilgan harakatlar tarixi (kim, nima, qachon, nimani o'zgartirdi)."""

    class Action(models.TextChoices):
        CREATE = "create", "Qöşildi"
        UPDATE = "update", "Özgartirildi"
        DELETE = "delete", "Öçirildi"
        REORDER = "reorder", "Tartib özgardi"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="audit_logs")
    user_label = models.CharField(max_length=150, blank=True)  # foydalanuvchi o'chsa ham nomi qoladi
    action = models.CharField(max_length=10, choices=Action.choices)
    model_key = models.CharField(max_length=80, db_index=True)  # masalan "content.news"
    model_label = models.CharField(max_length=120)
    object_id = models.CharField(max_length=40, blank=True)
    object_repr = models.CharField(max_length=200, blank=True)
    changes = models.JSONField(default=list, blank=True)  # [{"f": maydon, "old": ..., "new": ...}]
    ip = models.GenericIPAddressField(null=True, blank=True)
    path = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        verbose_name = "Harakat tarixi"
        verbose_name_plural = "Harakatlar tarixi"

    def __str__(self):
        return f"{self.user_label} {self.action} {self.model_label} #{self.object_id}"
