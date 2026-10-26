from rest_framework import viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from apps.core.permissions import IsPlatformAdmin, IsStaffUser
from apps.core.viewsets import ReorderMixin, UniversityScopedViewSet

from .models import Program, Requirement, University, UniversityMedia, UsefulLink
from .serializers import (
    AdminProgramSerializer,
    AdminRequirementSerializer,
    AdminUniversityMediaSerializer,
    AdminUniversitySerializer,
    AdminUsefulLinkSerializer,
)


class AdminUniversityViewSet(ReorderMixin, viewsets.ModelViewSet):
    serializer_class = AdminUniversitySerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filterset_fields = ["country", "is_published"]

    def get_permissions(self):
        if self.action in ("create", "destroy", "reorder"):
            return [IsPlatformAdmin()]
        return [IsStaffUser()]

    def get_queryset(self):
        qs = University.objects.all()
        user = self.request.user
        if user.is_platform_admin:
            return qs
        return qs.filter(pk=user.university_id)


class AdminRequirementViewSet(UniversityScopedViewSet):
    model = Requirement
    serializer_class = AdminRequirementSerializer


class AdminProgramViewSet(UniversityScopedViewSet):
    model = Program
    serializer_class = AdminProgramSerializer


class AdminUniversityMediaViewSet(UniversityScopedViewSet):
    model = UniversityMedia
    serializer_class = AdminUniversityMediaSerializer


class AdminUsefulLinkViewSet(UniversityScopedViewSet):
    model = UsefulLink
    serializer_class = AdminUsefulLinkSerializer
    university_required = False  # bo'sh university = bosh sahifadagi umumiy havola

    def perform_update(self, serializer):
        # Vakil umumiy (university=None) havolalarni ko'ra olmaydi — get_queryset cheklaydi
        super().perform_update(serializer)
