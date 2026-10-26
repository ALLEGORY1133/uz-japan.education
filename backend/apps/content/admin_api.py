from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsPlatformAdmin
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
    queryset = HeroSlide.objects.all()
    serializer_class = AdminHeroSlideSerializer


class AdminHeroSlideImageViewSet(AdminOnlyViewSet):
    queryset = HeroSlideImage.objects.all()
    serializer_class = AdminHeroSlideImageSerializer
    filterset_fields = ["slide"]


class AdminSiteMediaViewSet(AdminOnlyViewSet):
    queryset = SiteMedia.objects.all()
    serializer_class = AdminSiteMediaSerializer


class AdminNewsViewSet(AdminOnlyViewSet):
    queryset = News.objects.all()
    serializer_class = AdminNewsSerializer
    filterset_fields = ["category", "is_published"]


class AdminNewsMediaViewSet(AdminOnlyViewSet):
    queryset = NewsMedia.objects.all()
    serializer_class = AdminNewsMediaSerializer
    filterset_fields = ["news"]


class AdminStatViewSet(AdminOnlyViewSet):
    queryset = Stat.objects.all()
    serializer_class = AdminStatSerializer


class AdminSiteSettingsView(APIView):
    permission_classes = [IsPlatformAdmin]

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
