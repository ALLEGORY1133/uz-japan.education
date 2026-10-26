from django.db.models import Q
from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from .models import University
from .serializers import UniversityDetailSerializer, UniversityListSerializer


class PublicUniversityViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /api/public/universities/  va  /api/public/universities/<slug>/"""

    permission_classes = [AllowAny]
    pagination_class = None
    lookup_field = "slug"
    filterset_fields = ["country", "admission_status"]

    def get_serializer_class(self):
        return UniversityDetailSerializer if self.action == "retrieve" else UniversityListSerializer

    def get_queryset(self):
        qs = University.objects.filter(is_published=True)
        params = self.request.query_params
        search = (params.get("search") or "").strip()
        if search:
            qs = qs.filter(
                Q(name_uz__icontains=search) | Q(name_ja__icontains=search) | Q(name_en__icontains=search)
                | Q(short_name__icontains=search) | Q(native_name__icontains=search)
                | Q(city_uz__icontains=search) | Q(city_en__icontains=search)
            )
        degree = params.get("degree")
        if degree == "bachelor":
            qs = qs.filter(has_bachelor=True)
        elif degree == "master":
            qs = qs.filter(has_master=True)
        elif degree == "doctoral":
            qs = qs.filter(has_doctoral=True)
        if self.action == "retrieve":
            qs = qs.prefetch_related("requirements", "programs", "media", "links")
        return qs
