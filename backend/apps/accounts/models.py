from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        PLATFORM_ADMIN = "platform_admin", "Platforma administratori"
        UNIVERSITY_REP = "university_rep", "Universitet vakili"
        CONTENT_MANAGER = "content_manager", "Kontent menejeri"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.UNIVERSITY_REP)
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
