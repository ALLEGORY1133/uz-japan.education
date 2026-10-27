from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsPlatformAdmin, SectionPermission
from apps.core.viewsets import AdminOnlyViewSet

from .models import HeroSlide, HeroSlideImage, News, NewsMedia, SiteMedia, SiteSettings, Stat
from .serializers import (
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
