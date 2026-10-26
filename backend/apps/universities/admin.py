from django.contrib import admin
from modeltranslation.admin import TranslationAdmin, TranslationTabularInline

from .models import Program, Requirement, University, UniversityMedia, UsefulLink


class RequirementInline(TranslationTabularInline):
    model = Requirement
    extra = 0


class ProgramInline(TranslationTabularInline):
    model = Program
    extra = 0


class MediaInline(TranslationTabularInline):
    model = UniversityMedia
    extra = 0


@admin.register(University)
class UniversityAdmin(TranslationAdmin):
    list_display = ("name", "country", "admission_status", "application_deadline", "is_published")
    list_filter = ("country", "admission_status", "is_published")
    search_fields = ("name", "slug", "short_name")
    prepopulated_fields = {"slug": ("short_name",)}
    inlines = [RequirementInline, ProgramInline, MediaInline]


@admin.register(UsefulLink)
class UsefulLinkAdmin(TranslationAdmin):
    list_display = ("title", "university", "url", "is_visible", "sort_order")
    list_filter = ("university", "is_visible")
