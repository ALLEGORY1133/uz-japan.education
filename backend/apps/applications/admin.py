from django.contrib import admin

from .models import Application, ApplicationDocument


class DocumentInline(admin.TabularInline):
    model = ApplicationDocument
    extra = 0
    fields = ("doc_type", "original_name", "size", "created_at")
    readonly_fields = fields
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ("last_name", "first_name", "university", "degree", "funding", "status", "is_submitted", "created_at")
    list_filter = ("status", "degree", "funding", "university", "is_submitted")
    search_fields = ("first_name", "last_name", "email", "tracking_code")
    inlines = [DocumentInline]
