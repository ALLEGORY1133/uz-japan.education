from django.db.models import Q
from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import AuditLog
from .permissions import SectionPermission


class AuditLogSerializer(serializers.ModelSerializer):
    action_label = serializers.CharField(source="get_action_display", read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            "id", "user", "user_label", "action", "action_label", "model_key", "model_label",
            "object_id", "object_repr", "changes", "ip", "created_at",
        ]
        read_only_fields = fields


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /api/admin/history/?action=&model_key=&user=&q=&date_from=&date_to= — faqat platforma administratori."""

    permission_classes = [SectionPermission]
    section = "history"
    serializer_class = AuditLogSerializer
    filterset_fields = ["action", "model_key", "user"]

    def get_queryset(self):
        qs = AuditLog.objects.all()
        p = self.request.query_params
        q = (p.get("q") or "").strip()
        if q:
            qs = qs.filter(Q(object_repr__icontains=q) | Q(user_label__icontains=q) | Q(model_label__icontains=q))
        if p.get("date_from"):
            qs = qs.filter(created_at__date__gte=p["date_from"])
        if p.get("date_to"):
            qs = qs.filter(created_at__date__lte=p["date_to"])
        return qs

    @action(detail=False, methods=["get"])
    def facets(self, request):
        """Filtr uchun variantlar: bo'limlar va foydalanuvchilar."""
        models_ = AuditLog.objects.values_list("model_key", "model_label").distinct().order_by("model_label")
        users = AuditLog.objects.exclude(user__isnull=True).values_list("user", "user_label").distinct().order_by("user_label")
        return Response({
            "models": [{"value": k, "label": v} for k, v in models_],
            "users": [{"value": str(k), "label": v} for k, v in users],
        })
