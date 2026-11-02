from django.conf import settings
from django.db import DatabaseError, transaction
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.alphabet import to_new_alphabet
from apps.universities.models import University, UsefulLink
from apps.universities.serializers import PublicLinkSerializer, UniversityListSerializer

from .models import AboutItem, GalleryImage, HeroSlide, News, SiteMedia, SiteSettings, Stat
from .serializers import (
    PublicHeroSlideSerializer,
    PublicNewsDetailSerializer,
    PublicNewsListSerializer,
    PublicAboutItemSerializer,
    PublicGalleryImageSerializer,
    PublicSiteMediaSerializer,
    PublicSiteSettingsSerializer,
    PublicStatSerializer,
)


def _gallery_extra(ctx):
    """Migratsiya hali qo'llanmagan bo'lsa ham bosh sahifa ishlashda davom etsin."""
    try:
        with transaction.atomic():
            return PublicGalleryImageSerializer(list(GalleryImage.objects.all()), many=True, context=ctx).data
    except DatabaseError:
        return []


class AboutView(APIView):
    """«Biz haqimizda»: tarix, yutuqlar va tahlillar."""

    permission_classes = [AllowAny]

    def get(self, request):
        ctx = {"request": request}
        rows = list(AboutItem.objects.filter(is_visible=True))
        out = {"history": [], "achievements": [], "analyses": []}
        bucket = {"history": "history", "achievement": "achievements", "analysis": "analyses"}
        for r in rows:
            out[bucket[r.kind]].append(r)
        for k in out:
            out[k] = PublicAboutItemSerializer(out[k], many=True, context=ctx).data
        return Response(out)


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
                News.objects.filter(is_published=True).exclude(category="cooperation").prefetch_related("media")[:8], many=True, context=ctx
            ).data,
            "updates": PublicNewsListSerializer(
                News.objects.filter(is_published=True, category="platform").prefetch_related("media")[:6], many=True, context=ctx
            ).data,
            "events": PublicNewsListSerializer(
                News.objects.filter(is_published=True, category="event", event_starts_at__gte=timezone.now())
                .prefetch_related("media")
                .order_by("event_starts_at")[:8],
                many=True,
                context=ctx,
            ).data,
            "links": PublicLinkSerializer(
                UsefulLink.objects.filter(university__isnull=True, is_visible=True), many=True, context=ctx
            ).data,
            "media": {
                m["key"]: m
                for m in PublicSiteMediaSerializer(SiteMedia.objects.all(), many=True, context=ctx).data
            },
            "achievements": PublicAboutItemSerializer(
                AboutItem.objects.filter(is_visible=True, kind=AboutItem.Kind.ACHIEVEMENT)[:8], many=True, context=ctx
            ).data,
            "gallery_extra": _gallery_extra(ctx),
            "settings": PublicSiteSettingsSerializer(SiteSettings.load(), context=ctx).data,
        }
        return Response(data)


class NewsPagination(PageNumberPagination):
    page_size = 100  # eski so'rovlar uchun; sayt ?page_size=12 bilan sahifalaydi
    page_size_query_param = "page_size"
    max_page_size = 100


def search_news(qs, q):
    """Sarlavha/mazmun/matn bo'yicha barcha tillarda qidirish (?q=). Eski alifboda yozilsa ham topadi."""
    q = (q or "").strip()[:100]
    if not q:
        return qs
    cond = Q()
    for w in {q, to_new_alphabet(q)}:
        for f in ("title", "summary", "body"):
            for lang in settings.MODELTRANSLATION_LANGUAGES:
                cond |= Q(**{f"{f}_{lang}__icontains": w})
    return qs.filter(cond)


class PublicNewsViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    lookup_field = "slug"
    filterset_fields = ["category"]
    pagination_class = NewsPagination

    def get_queryset(self):
        qs = News.objects.filter(is_published=True).prefetch_related("media")
        if self.action == "list":
            qs = search_news(qs, self.request.query_params.get("q"))
        return qs

    @action(detail=False)
    def counts(self, request):
        """Yangiliklar sahifasi tablari uchun: har bir turkumda nechta yozuv (qidiruv hisobga olinadi)."""
        qs = search_news(News.objects.filter(is_published=True), request.query_params.get("q"))
        out = {c: 0 for c in News.Category.values}
        out.update({r["category"]: r["n"] for r in qs.values("category").annotate(n=Count("id")).order_by()})
        return Response(out)

    def get_serializer_class(self):
        return PublicNewsDetailSerializer if self.action == "retrieve" else PublicNewsListSerializer
