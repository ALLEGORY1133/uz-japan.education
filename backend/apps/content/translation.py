from modeltranslation.translator import TranslationOptions, register

from .models import HeroSlide, News, SiteMedia, SiteSettings, Stat


@register(HeroSlide)
class HeroSlideTR(TranslationOptions):
    fields = ("eyebrow", "title", "highlight", "description", "primary_label", "secondary_label")


@register(SiteMedia)
class SiteMediaTR(TranslationOptions):
    fields = ("caption",)


@register(News)
class NewsTR(TranslationOptions):
    fields = ("title", "summary", "body", "event_location")


@register(Stat)
class StatTR(TranslationOptions):
    fields = ("label",)


@register(SiteSettings)
class SiteSettingsTR(TranslationOptions):
    fields = ("address",)
