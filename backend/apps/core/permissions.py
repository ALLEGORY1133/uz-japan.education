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


class SectionPermission(BasePermission):
    """Bo'lim ruxsati: view — faqat o'qish, edit — hammasi. Bo'lim `view.section` da ko'rsatiladi."""

    def has_permission(self, request, view):
        from rest_framework.permissions import SAFE_METHODS

        u = request.user
        if not (u and u.is_authenticated):
            return False
        lvl = u.perm(getattr(view, "section", None))
        return lvl == "edit" or (lvl == "view" and request.method in SAFE_METHODS)


class ApplicationsAccess(SectionPermission):
    """Arizalar: administrator va vakil (o'z universiteti) yoki 'applications' bo'limi ruxsati bor rol."""

    def has_permission(self, request, view):
        if IsStaffUser().has_permission(request, view):
            return True
        return super().has_permission(request, view)


class IsAnyStaff(BasePermission):
    """Admin paneliga kirish huquqi bor har qanday foydalanuvchi (yordamchi uchun)."""

    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and u.has_panel_access)
