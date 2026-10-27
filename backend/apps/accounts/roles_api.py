from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.permissions import IsPlatformAdmin

from .models import Role
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

    def destroy(self, request, *args, **kwargs):
        role = self.get_object()
        if role.users.exists():
            return Response({"detail": f"Bu rol {role.users.count()} ta foydalanuvçiga biriktirilgan. Avval ularning rolini özgartiring."}, status=status.HTTP_400_BAD_REQUEST)
        return super().destroy(request, *args, **kwargs)
