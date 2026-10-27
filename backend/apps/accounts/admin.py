from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (("Rol", {"fields": ("role", "university")}),)
    add_fieldsets = UserAdmin.add_fieldsets + (("Rol", {"fields": ("role", "university")}),)
    list_display = ("username", "email", "role", "university", "is_active")
    list_filter = ("role", "is_active")


from .models import LoginAttempt  # noqa: E402


@admin.register(LoginAttempt)
class LoginAttemptAdmin(admin.ModelAdmin):
    list_display = ("created_at", "username", "ip", "success")
    list_filter = ("success",)
    search_fields = ("username", "ip")
    readonly_fields = ("username", "ip", "success", "created_at")

    def has_add_permission(self, request):
        return False


from .models import Role  # noqa: E402


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("name", "description")
