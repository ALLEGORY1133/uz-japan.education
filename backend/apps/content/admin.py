from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from .models import HeroSlide, News, SiteMedia, SiteSettings, Stat


@admin.register(HeroSlide)
class HeroSlideAdmin(TranslationAdmin):
    list_display = ("title", "media_kind", "sort_order", "is_visible")
    list_editable = ("sort_order", "is_visible")


@admin.register(SiteMedia)
class SiteMediaAdmin(TranslationAdmin):
    list_display = ("key", "kind")


@admin.register(News)
class NewsAdmin(TranslationAdmin):
    list_display = ("title", "category", "link_type", "published_at", "is_published")
    list_filter = ("category", "is_published")


@admin.register(Stat)
class StatAdmin(TranslationAdmin):
    list_display = ("label", "value", "suffix", "sort_order", "is_visible")
    list_editable = ("sort_order", "is_visible")


@admin.register(SiteSettings)
class SiteSettingsAdmin(TranslationAdmin):
    pass
