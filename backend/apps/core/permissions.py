from rest_framework.permissions import BasePermission


class IsPlatformAdmin(BasePermission):
    """Faqat platforma administratori."""

    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and u.is_platform_admin)


class IsStaffUser(BasePermission):
    """Platforma administratori yoki universitetga biriktirilgan vakil."""

    def has_permission(self, request, view):
        u = request.user
        if not (u and u.is_authenticated):
            return False
        return u.is_platform_admin or (u.is_university_rep and u.university_id is not None)


class IsContentEditor(BasePermission):
    """Platforma administratori yoki kontent menejeri (slayder, yangilik, statistika, media)."""

    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and u.can_edit_content)
