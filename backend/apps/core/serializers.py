"""Umumiy serializer yordamchilari.

- Rasm/fayl URL'lari NISBIY (/media/...) qaytariladi: frontend ularni
  o'z NEXT_PUBLIC_MEDIA_URL manziliga ulaydi. Shunda Docker ichidagi
  server-to-server so'rovlar ham brauzer uchun to'g'ri URL beradi.
- Admin serializerlarida tarjima maydonlarining asosiy (original) varianti
  faqat o'qiladi; yozish name_uz / name_ja / name_en orqali bajariladi.
"""
from django.core.files.uploadedfile import UploadedFile
from django.db import models
from modeltranslation.translator import NotRegistered, translator
from rest_framework import serializers

from .images import optimize_upload


class RelativeImageField(serializers.ImageField):
    def to_representation(self, value):
        if not value:
            return None
        try:
            return value.url
        except ValueError:
            return None


class RelativeFileField(serializers.FileField):
    def to_representation(self, value):
        if not value:
            return None
        try:
            return value.url
        except ValueError:
            return None


class BaseModelSerializer(serializers.ModelSerializer):
    serializer_field_mapping = {
        **serializers.ModelSerializer.serializer_field_mapping,
        models.ImageField: RelativeImageField,
        models.FileField: RelativeFileField,
    }


class AdminModelSerializer(BaseModelSerializer):
    """Barcha tillar maydonlarini (name_uz, name_ja, name_en) ochib beradi.

    Yuklangan rasmlar avtomatik optimallashtiriladi (core/images.py).
    """

    def to_internal_value(self, data):
        ret = super().to_internal_value(data)
        request = self.context.get("request")
        quality = (request.data.get("quality") if request is not None else None) or "high"
        for key, val in list(ret.items()):
            if isinstance(val, UploadedFile):
                ret[key] = optimize_upload(val, quality)
        return ret

    def get_extra_kwargs(self):
        extra = super().get_extra_kwargs()
        model = self.Meta.model
        try:
            opts = translator.get_options_for_model(model)
        except NotRegistered:
            return extra
        for field_name in opts.fields:  # tuple yoki dict — ikkalasi ham nomlarni beradi
            kw = extra.get(field_name, {})
            kw["read_only"] = True
            kw.pop("required", None)
            extra[field_name] = kw
        return extra
