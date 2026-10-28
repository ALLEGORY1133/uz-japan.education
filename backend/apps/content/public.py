from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.universities.models import University, UsefulLink
from apps.universities.serializers import PublicLinkSerializer, UniversityListSerializer

from .models import HeroSlide, News, SiteMedia, SiteSettings, Stat
from .serializers import (
    PublicHeroSlideSerializer,
    PublicNewsDetailSerializer,
    PublicNewsListSerializer,
    PublicSiteMediaSerializer,
    PublicSiteSettingsSerializer,
    PublicStatSerializer,
)


class HomeView(APIView):
    """Bosh sahifa uchun bitta so'rovda hamma narsa."""

    permission_classes = [AllowAny]

    def get(self, request):
        ctx = {"request": request}
        data = {
            "hero": PublicHeroSlideSerializer(
                HeroSlide.objects.filter(is_visible=True).prefetch_related("images"), many=True, context=ctx
            ).data,
            "stats": PublicStatSerializer(Stat.objects.filter(is_visible=True), many=True, context=ctx).data,
            "universities": UniversityListSerializer(
                University.objects.filter(is_published=True), many=True, context=ctx
            ).data,
            "news": PublicNewsListSerializer(
                News.objects.filter(is_published=True).prefetch_related("media")[:8], many=True, context=ctx
            ).data,
            "links": PublicLinkSerializer(
                UsefulLink.objects.filter(university__isnull=True, is_visible=True), many=True, context=ctx
            ).data,
            "media": {
                m["key"]: m
                for m in PublicSiteMediaSerializer(SiteMedia.objects.all(), many=True, context=ctx).data
            },
            "settings": PublicSiteSettingsSerializer(SiteSettings.load(), context=ctx).data,
        }
        return Response(data)


class PublicNewsViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    lookup_field = "slug"
    filterset_fields = ["category"]

    def get_queryset(self):
        return News.objects.filter(is_published=True).prefetch_related("media")

    def get_serializer_class(self):
        return PublicNewsDetailSerializer if self.action == "retrieve" else PublicNewsListSerializer
