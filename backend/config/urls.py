from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from apps.core.audit_api import AuditLogViewSet
from apps.core.kpi_api import KPIDashboardView, KPIExportView
from rest_framework.routers import DefaultRouter
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.accounts import security as sec
from apps.accounts.password_reset import ForgotPasswordView, ResetPasswordView

from apps.accounts.serializers import LoginSerializer, MeSerializer, UserAdminSerializer
from apps.accounts.models import User
from apps.applications.views import (
    AdminApplicationViewSet,
    AdminInquiryViewSet,
    ApplicationCreateView,
    InquiryCreateView,
    ApplicationDocumentDeleteView,
    ApplicationDocumentUploadView,
    ApplicationStatusView,
    ApplicationSubmitView,
    DashboardView,
)
from apps.applications.cabinet import CabinetInquiryView, CabinetLoginView, CabinetMeView, CabinetVerifyView
from apps.content.media_library import MediaLibraryItemView, MediaLibraryView
from apps.content.admin_api import (
    AdminHeroSlideImageViewSet,
    AdminHeroSlideViewSet,
    AdminNewsMediaViewSet,
    AdminNewsViewSet,
    AdminSiteMediaViewSet,
    AdminSiteSettingsView,
    AdminStatViewSet,
)
from apps.content.public import HomeView, PublicNewsViewSet
from apps.core.permissions import IsPlatformAdmin
from apps.universities.admin_api import (
    AdminProgramViewSet,
    AdminRequirementViewSet,
    AdminUniversityMediaViewSet,
    AdminUniversityViewSet,
    AdminUsefulLinkViewSet,
)
from apps.universities.public import PublicUniversityViewSet
from rest_framework import viewsets


class LoginView(TokenObtainPairView):
    """Kirish: ketma-ket xato urinishlardan keyin hisob (va IP) vaqtincha bloklanadi."""

    serializer_class = LoginSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        username = sec.norm(request.data.get("username"))
        ip = sec.client_ip(request)
        wait = sec.lock_seconds(username, ip)
        if wait:
            return Response(
                {"detail": f"Juda köp xato uriniş. {-(-wait // 60)} daqiqadan söng qayta urinib köring yoki parolni tiklang.", "locked": True, "retry_after": wait},
                status=429, headers={"Retry-After": str(wait)},
            )
        try:
            resp = super().post(request, *args, **kwargs)
        except (AuthenticationFailed, InvalidToken):
            sec.record(username, ip, False)
            left = sec.attempts_left(username)
            if sec.lock_seconds(username, ip):
                return Response(
                    {"detail": "Juda köp xato uriniş. Hisob vaqtinça bloklandi. Birozdan söng urinib köring yoki parolni tiklang.", "locked": True, "retry_after": int(sec.LOCK.total_seconds())},
                    status=429, headers={"Retry-After": str(int(sec.LOCK.total_seconds()))},
                )
            return Response({"detail": "Login yoki parol notöğri.", "attempts_left": left}, status=401)
        if resp.status_code == 200:
            sec.record(username, ip, True)
        return resp


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(MeSerializer(request.user).data)


class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.select_related("university").order_by("id")
    serializer_class = UserAdminSerializer
    permission_classes = [IsPlatformAdmin]
    filterset_fields = ["role", "university", "is_active"]


def health(_request):
    return JsonResponse({"status": "ok"})


# ---- Ochiq API (registratsiyasiz)
public_router = DefaultRouter()
public_router.register("universities", PublicUniversityViewSet, basename="public-university")
public_router.register("news", PublicNewsViewSet, basename="public-news")

# ---- Admin API (JWT)
admin_router = DefaultRouter()
admin_router.register("universities", AdminUniversityViewSet, basename="admin-university")
admin_router.register("requirements", AdminRequirementViewSet, basename="admin-requirement")
admin_router.register("programs", AdminProgramViewSet, basename="admin-program")
admin_router.register("university-media", AdminUniversityMediaViewSet, basename="admin-university-media")
admin_router.register("useful-links", AdminUsefulLinkViewSet, basename="admin-useful-link")
admin_router.register("inquiries", AdminInquiryViewSet, basename="admin-inquiry")
admin_router.register("applications", AdminApplicationViewSet, basename="admin-application")
admin_router.register("hero-slides", AdminHeroSlideViewSet, basename="admin-hero")
admin_router.register("hero-slide-images", AdminHeroSlideImageViewSet, basename="admin-hero-image")
admin_router.register("site-media", AdminSiteMediaViewSet, basename="admin-site-media")
admin_router.register("news", AdminNewsViewSet, basename="admin-news")
admin_router.register("news-media", AdminNewsMediaViewSet, basename="admin-news-media")
admin_router.register("stats", AdminStatViewSet, basename="admin-stat")
admin_router.register("users", AdminUserViewSet, basename="admin-user")
admin_router.register("history", AuditLogViewSet, basename="admin-history")

urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("api/health/", health),
    path("api/public/home/", HomeView.as_view()),
    path("api/public/applications/", ApplicationCreateView.as_view()),
    path("api/public/applications/status/", ApplicationStatusView.as_view()),
    path("api/public/applications/<str:code>/documents/", ApplicationDocumentUploadView.as_view()),
    path("api/public/applications/<str:code>/documents/<int:pk>/", ApplicationDocumentDeleteView.as_view()),
    path("api/public/applications/<str:code>/submit/", ApplicationSubmitView.as_view()),
    path("api/public/inquiries/", InquiryCreateView.as_view()),
    path("api/public/cabinet/login/", CabinetLoginView.as_view()),
    path("api/public/cabinet/verify/", CabinetVerifyView.as_view()),
    path("api/public/cabinet/me/", CabinetMeView.as_view()),
    path("api/public/cabinet/inquiries/", CabinetInquiryView.as_view()),
    path("api/public/", include(public_router.urls)),
    path("api/admin/auth/token/", LoginView.as_view()),
    path("api/admin/auth/refresh/", TokenRefreshView.as_view()),
    path("api/admin/auth/forgot/", ForgotPasswordView.as_view()),
    path("api/admin/auth/reset/", ResetPasswordView.as_view()),
    path("api/admin/me/", MeView.as_view()),
    path("api/admin/dashboard/", DashboardView.as_view()),
    path("api/admin/site-settings/", AdminSiteSettingsView.as_view()),
    path("api/admin/kpi/", KPIDashboardView.as_view()),
    path("api/admin/kpi/export/", KPIExportView.as_view()),
    path("api/admin/media-library/", MediaLibraryView.as_view()),
    path("api/admin/media-library/<str:source>/<int:pk>/", MediaLibraryItemView.as_view()),
    path("api/admin/", include(admin_router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
