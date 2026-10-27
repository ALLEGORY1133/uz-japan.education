from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.permissions import IsPlatformAdmin

from .models import Role, User
from .rbac import SECTIONS
from .serializers import RoleSerializer


class RoleViewSet(viewsets.ModelViewSet):
    """Rollarni boshqarish — faqat platforma administratori (superadmin)."""

    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsPlatformAdmin]
    pagination_class = None

    @action(detail=False, methods=["get"])
    def sections(self, request):
        return Response([{"key": k, "label": label} for k, label in SECTIONS])

    @action(detail=False, methods=["get"])
    def options(self, request):
        """Foydalanuvchi formasi uchun yagona rol ro'yxati: tayyor rollar + superadmin yaratganlari."""
        base = [{"id": k, "name": label} for k, label in User.Role.choices if k != User.Role.CUSTOM]
        return Response(base + [{"id": f"custom:{r.id}", "name": r.name} for r in Role.objects.all()])

    def destroy(self, request, *args, **kwargs):
        role = self.get_object()
        if role.users.exists():
            return Response({"detail": f"Bu rol {role.users.count()} ta foydalanuvçiga biriktirilgan. Avval ularning rolini özgartiring."}, status=status.HTTP_400_BAD_REQUEST)
        return super().destroy(request, *args, **kwargs)
