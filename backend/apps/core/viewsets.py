from django.db import transaction
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from .permissions import IsPlatformAdmin, IsStaffUser


class ReorderMixin:
    """POST .../reorder/  {"ids": [3, 1, 2]} — sort_order ni ketma-ketlikka moslaydi."""

    @action(detail=False, methods=["post"])
    def reorder(self, request):
        ids = request.data.get("ids")
        if not isinstance(ids, list):
            raise ValidationError({"ids": "ID’lar röyxati kerak."})
        try:
            ids = [int(x) for x in ids]
        except (TypeError, ValueError):
            raise ValidationError({"ids": "ID’lar son bölişi kerak."})
        objs = {o.pk: o for o in self.get_queryset().filter(pk__in=ids)}
        with transaction.atomic():
            for index, pk in enumerate(ids):
                obj = objs.get(pk)
                if obj is not None and obj.sort_order != index:
                    obj.sort_order = index
                    obj.save(update_fields=["sort_order"])
        from . import audit

        audit.write("reorder", self.get_queryset().model, "", f"{len(ids)} ta element")
        return Response({"ok": True})


class AdminOnlyViewSet(ReorderMixin, viewsets.ModelViewSet):
    """Faqat platforma administratori uchun (slayder, yangiliklar, statistika...)."""

    permission_classes = [IsPlatformAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]


class UniversityScopedViewSet(ReorderMixin, viewsets.ModelViewSet):
    """Universitetga bog'langan obyektlar.

    - Administrator: hammasi (?university=<id> bilan filtrlash mumkin).
    - Vakil: faqat o'z universiteti obyektlari; yaratishda university avtomatik.
    """

    permission_classes = [IsStaffUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filterset_fields = ["university"]
    model = None
    university_required = True  # UsefulLink uchun False (umumiy havola)

    def get_queryset(self):
        qs = self.model.objects.select_related("university")
        user = self.request.user
        if user.is_platform_admin:
            return qs
        return qs.filter(university_id=user.university_id)

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_platform_admin:
            if self.university_required and not serializer.validated_data.get("university"):
                raise ValidationError({"university": "Universitetni tanlang."})
            serializer.save()
        else:
            serializer.save(university=user.university)

    def perform_update(self, serializer):
        user = self.request.user
        if user.is_platform_admin:
            serializer.save()
        else:
            serializer.save(university=user.university)
