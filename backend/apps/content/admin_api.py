from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsPlatformAdmin, SectionPermission
from apps.core.viewsets import AdminOnlyViewSet

from .models import GalleryImage, HeroSlide, HeroSlideImage, News, NewsMedia, SiteMedia, SiteSettings, Stat
from .serializers import (
    AdminGalleryImageSerializer,
    AdminHeroSlideImageSerializer,
    AdminHeroSlideSerializer,
    AdminNewsMediaSerializer,
    AdminNewsSerializer,
    AdminSiteMediaSerializer,
    AdminSiteSettingsSerializer,
    AdminStatSerializer,
)


class AdminHeroSlideViewSet(AdminOnlyViewSet):
    section = "hero"
    queryset = HeroSlide.objects.all()
    serializer_class = AdminHeroSlideSerializer


class AdminHeroSlideImageViewSet(AdminOnlyViewSet):
    section = "hero"
    queryset = HeroSlideImage.objects.all()
    serializer_class = AdminHeroSlideImageSerializer
    filterset_fields = ["slide"]


class AdminSiteMediaViewSet(AdminOnlyViewSet):
    section = "site_media"
    queryset = SiteMedia.objects.all()
    serializer_class = AdminSiteMediaSerializer


class AdminGalleryImageViewSet(AdminOnlyViewSet):
    section = "site_media"
    queryset = GalleryImage.objects.all()
    serializer_class = AdminGalleryImageSerializer


class AdminNewsViewSet(AdminOnlyViewSet):
    section = "news"
    queryset = News.objects.all()
    serializer_class = AdminNewsSerializer
    filterset_fields = ["category", "is_published"]


class AdminNewsMediaViewSet(AdminOnlyViewSet):
    section = "news"
    queryset = NewsMedia.objects.all()
    serializer_class = AdminNewsMediaSerializer
    filterset_fields = ["news"]


class AdminStatViewSet(AdminOnlyViewSet):
    section = "stats"
    queryset = Stat.objects.all()
    serializer_class = AdminStatSerializer


class AdminOperatorsView(APIView):
    """Admin footeri uchun: tizimga kirgan har bir xodim operatorlarni ko'ra oladi."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(SiteSettings.load().operators or [])


class AdminOperatorCandidatesView(APIView):
    """Operator qo'shishda tanlash uchun: bazadagi xodimlar va lavozimlar katalogi."""

    permission_classes = [SectionPermission]
    section = "settings"

    def get(self, request):
        from django.contrib.auth import get_user_model

        from apps.accounts.models import Role

        User = get_user_model()
        users = []
        for u in User.objects.filter(is_active=True).select_related("custom_role").order_by("first_name", "username"):
            if not u.has_panel_access:
                continue
            role = u.custom_role.name if u.custom_role_id else u.get_role_display()
            users.append({"id": u.id, "name": u.get_full_name().strip() or u.username, "role": role})
        roles = [label for _, label in User.Role.choices if _ != "custom"]
        roles += [r.name for r in Role.objects.all()]
        return Response({"users": users, "roles": list(dict.fromkeys(roles))})


class AdminSiteSettingsView(APIView):
    permission_classes = [SectionPermission]
    section = "settings"

    def get(self, request):
        return Response(AdminSiteSettingsSerializer(SiteSettings.load(), context={"request": request}).data)

    def put(self, request):
        return self._save(request, partial=False)

    def patch(self, request):
        return self._save(request, partial=True)

    def _save(self, request, partial):
        ser = AdminSiteSettingsSerializer(
            SiteSettings.load(), data=request.data, partial=partial, context={"request": request}
        )
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)
