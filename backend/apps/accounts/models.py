from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.Model):
    """Superadmin yaratadigan rol: bo'limlar bo'yicha ruxsatlar {bo'lim: 'view'|'edit'}."""

    name = models.CharField("Nomi", max_length=80, unique=True)
    description = models.CharField("Izoh", max_length=200, blank=True)
    permissions = models.JSONField("Ruxsatlar", default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Rol"
        verbose_name_plural = "Rollar"

    def __str__(self):
        return self.name


class User(AbstractUser):
    class Role(models.TextChoices):
        PLATFORM_ADMIN = "platform_admin", "Platforma administratori"
        UNIVERSITY_REP = "university_rep", "Universitet vakili"
        CONTENT_MANAGER = "content_manager", "Kontent menejeri"
        CUSTOM = "custom", "Maxsus rol"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.UNIVERSITY_REP)
    custom_role = models.ForeignKey("accounts.Role", null=True, blank=True, on_delete=models.PROTECT, related_name="users", verbose_name="Maxsus rol")
    university = models.ForeignKey(
        "universities.University",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="representatives",
        help_text="Universitet vakili faqat şu universitet ma’lumotlarini tahrirlaydi.",
    )

    @property
    def is_platform_admin(self) -> bool:
        return self.is_superuser or self.role == self.Role.PLATFORM_ADMIN

    def perm(self, section):
        from .rbac import level_for

        return level_for(self, section)

    @property
    def has_panel_access(self) -> bool:
        from .rbac import permissions_for

        return (
            self.is_platform_admin
            or (self.is_university_rep and self.university_id is not None)
            or bool(permissions_for(self))
        )

    @property
    def is_content_manager(self) -> bool:
        return self.role == self.Role.CONTENT_MANAGER and not self.is_superuser

    @property
    def can_edit_content(self) -> bool:
        return self.is_platform_admin or self.is_content_manager

    @property
    def is_university_rep(self) -> bool:
        return self.role == self.Role.UNIVERSITY_REP and not self.is_superuser

    def __str__(self):
        return self.username


class LoginAttempt(models.Model):
    """Kirish urinishlari: ketma-ket xato urinishlardan keyin hisob/IP vaqtincha bloklanadi."""

    username = models.CharField(max_length=150, db_index=True)
    ip = models.GenericIPAddressField(null=True, blank=True, db_index=True)
    success = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.username} {'OK' if self.success else 'XATO'} {self.created_at:%Y-%m-%d %H:%M}"
