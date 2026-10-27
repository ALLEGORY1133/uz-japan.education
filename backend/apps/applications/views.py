import io
import logging
import re
import tempfile
import zipfile

from django.conf import settings
from django.core.mail import send_mail
from django.db.models import Count
from django.http import FileResponse
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.core.permissions import ApplicationsAccess, IsPlatformAdmin, IsStaffUser, SectionPermission

from .documents import check_and_prepare
from .models import Application, ApplicationDocument, Inquiry
from .serializers import (
    InquiryAdminSerializer,
    InquirySerializer,
    AdminApplicationSerializer,
    ApplicationCreateSerializer,
    ApplicationDocumentSerializer,
    active_application_for,
)

logger = logging.getLogger(__name__)


REQUIRED_DOC_TYPES = ("passport", "diploma", "transcript", "motivation")


def _doc_row(d):
    return ApplicationDocumentSerializer(d).data


def _store_document(app, upload, doc_type):
    if doc_type not in ApplicationDocument.Type.values:
        doc_type = ApplicationDocument.Type.OTHER
    upload = check_and_prepare(app, upload, doc_type)
    doc = ApplicationDocument(
        application=app,
        doc_type=doc_type,
        original_name=(getattr(upload, "name", "") or "fayl")[:200],
        size=upload.size,
        content_type=(getattr(upload, "content_type", "") or "")[:100],
        scan_status=getattr(upload, "scan_status", "skipped"),
        lang_checked=getattr(upload, "lang_checked", False),
    )
    doc.file.save(upload.name, upload, save=False)
    doc.save()
    return doc


# ----------------------------------------------------------------- ochiq (talaba)


class ApplicationCreateView(APIView):
    """POST /api/public/applications/ — anketa. Hujjatlar keyin alohida yuklanadi, so'ng /submit/."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "applications"

    def post(self, request):
        # Honeypot to'ldirilgan bo'lsa — jimgina "muvaffaqiyat" qaytaramiz, saqlamaymiz
        if (request.data.get("website") or "").strip():
            return Response({"ok": True, "code": "UJ-0000000000"}, status=status.HTTP_201_CREATED)

        ser = ApplicationCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        app = ser.save(is_submitted=False)
        return Response({"ok": True, "id": app.pk, "code": app.tracking_code}, status=status.HTTP_201_CREATED)


class _ApplicantMixin:
    """Kod orqali ariza topish. Yuborilgandan keyin email ham mos kelishi shart."""

    def get_app(self, request, code, require_email_when_submitted=True):
        try:
            app = Application.objects.select_related("university").get(tracking_code=code)
        except Application.DoesNotExist:
            raise NotFound()
        if app.is_submitted and require_email_when_submitted:
            email = (request.data.get("email") or request.query_params.get("email") or "").strip().lower()
            if email != app.email.lower():
                raise PermissionDenied("Email mos kelmadi.")
        return app


class ApplicationDocumentUploadView(_ApplicantMixin, APIView):
    """POST /api/public/applications/<kod>/documents/ — bitta fayl (doc_type + file)."""

    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "app_docs"

    def post(self, request, code):
        app = self.get_app(request, code)
        up = request.FILES.get("file")
        if not up:
            raise ValidationError({"file": "Fayl tanlang."})
        doc = _store_document(app, up, request.data.get("doc_type") or "other")
        return Response(_doc_row(doc), status=status.HTTP_201_CREATED)


class ApplicationDocumentDeleteView(_ApplicantMixin, APIView):
    """DELETE /api/public/applications/<kod>/documents/<id>/ — talaba xato yuklagan faylni olib tashlaydi."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "app_docs"

    def delete(self, request, code, pk):
        app = self.get_app(request, code)
        doc = app.documents.filter(pk=pk).first()
        if not doc:
            raise NotFound()
        doc.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ApplicationSubmitView(_ApplicantMixin, APIView):
    """POST /api/public/applications/<kod>/submit/ — barcha hujjatlar bilan bitta ariza sifatida yuboradi."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "app_docs"

    def post(self, request, code):
        app = self.get_app(request, code, require_email_when_submitted=False)
        if not app.is_submitted:
            have = set(app.documents.values_list("doc_type", flat=True))
            missing = [str(ApplicationDocument.Type(t).label) for t in REQUIRED_DOC_TYPES if t not in have]
            if missing:
                raise ValidationError({"documents": "Majburiy hujjatlar yuklanmagan: " + ", ".join(missing)})
            # Poyga holati: bir vaqtda ochilgan boshqa ariza allaqachon yuborilgan bo'lishi mumkin
            if active_application_for(app.email, exclude_pk=app.pk):
                return Response({"email": ["email_taken"]}, status=status.HTTP_409_CONFLICT)
            app.is_submitted = True
            app.submitted_at = timezone.now()
            app.save(update_fields=["is_submitted", "submitted_at", "updated_at"])
            self._notify(app)
        return Response({"ok": True, "code": app.tracking_code, "documents": app.documents.count()})

    @staticmethod
    def _notify(app):
        to = app.university.contact_email
        if not to:
            return
        try:
            send_mail(
                subject=f"Yangi ariza: {app.last_name} {app.first_name} ({app.tracking_code})",
                message=(
                    f"Universitet: {app.university.name}\n"
                    f"Ism: {app.first_name} {app.last_name}\n"
                    f"Email: {app.email}\nTelefon: {app.phone}\n"
                    f"Daraja: {app.get_degree_display()}\nMoliyalaştiriş: {app.get_funding_display()}\n"
                    f"Yuklangan hujjatlar: {app.documents.count()} ta (admin panelda köring)\n\n"
                    f"{app.message}"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[to],
                fail_silently=True,
            )
        except Exception:  # pragma: no cover
            logger.exception("Ariza xabarini yuborib bölmadi")


class ApplicationStatusView(APIView):
    """POST /api/public/applications/status/ {code, email} — holat va yuklangan hujjatlar."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "applications"

    def post(self, request):
        code = (request.data.get("code") or "").strip().upper()
        email = (request.data.get("email") or "").strip().lower()
        app = Application.objects.select_related("university").filter(tracking_code=code).first()
        if not app or app.email.lower() != email:
            raise NotFound("Ariza topilmadi. Kod va emailni tekşiring.")
        return Response(
            {
                "code": app.tracking_code,
                "university": app.university.name,
                "status": app.status,
                "is_submitted": app.is_submitted,
                "created_at": app.created_at,
                "documents": [_doc_row(d) for d in app.documents.all()],
            }
        )


# ----------------------------------------------------------------- admin / vakil


def _safe(name):
    return re.sub(r"[^\w.\-]+", "_", name, flags=re.UNICODE)[:80] or "fayl"


class AdminApplicationViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """Administrator: hamma arizalar; vakil: faqat o'z universiteti arizalari. Faqat yuborilganlari."""

    permission_classes = [ApplicationsAccess]
    section = "applications"
    filterset_fields = ["status", "university", "degree", "funding"]
    http_method_names = ["get", "patch", "head", "options"]

    def get_serializer_class(self):
        return AdminApplicationSerializer

    def get_queryset(self):
        qs = Application.objects.select_related("university").prefetch_related("documents").filter(is_submitted=True)
        user = self.request.user
        if user.is_platform_admin or user.perm("applications"):
            return qs
        return qs.filter(university_id=user.university_id)

    # --- hujjatlar
    @action(detail=True, methods=["get"], url_path=r"documents/(?P<doc_id>[0-9]+)/download")
    def download_document(self, request, pk=None, doc_id=None):
        app = self.get_object()
        doc = app.documents.filter(pk=doc_id).first()
        if not doc:
            raise NotFound()
        try:
            fh = doc.file.open("rb")
        except FileNotFoundError:
            raise NotFound("Fayl serverda topilmadi.")
        resp = FileResponse(fh, as_attachment=True, filename=doc.original_name)
        resp["Cache-Control"] = "private, no-store"
        return resp

    @action(detail=True, methods=["get"], url_path="download-all")
    def download_all(self, request, pk=None):
        """Arizadagi barcha hujjatlar + anketa — bitta ZIP fayl."""
        app = self.get_object()
        person = f"{_safe(app.first_name)}-{_safe(app.last_name)}".strip("-_") or app.tracking_code
        tmp = tempfile.SpooledTemporaryFile(max_size=32 * 1024 * 1024)
        with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as z:
            summary = io.StringIO()
            summary.write(f"Kod: {app.tracking_code}\nUniversitet: {app.university.name}\n")
            summary.write(f"Ism: {app.first_name} {app.last_name}\nEmail: {app.email}\nTelefon: {app.phone}\n")
            summary.write(f"Tuğilgan sana: {app.birth_date or ''}\nFuqaroligi: {app.citizenship}\nŞahar: {app.city}\n")
            summary.write(f"Otasining ismi: {app.middle_name}\nHujjat: {app.id_series} {app.passport_number}\nDaraja: {app.get_degree_display()}\n")
            summary.write(f"Moliyalaştiriş: {app.get_funding_display()}\nYönaliş: {app.program}\n\n{app.message}\n")
            z.writestr(f"{person}/ariza.txt", summary.getvalue())
            for i, d in enumerate(app.documents.all(), 1):
                try:
                    with d.file.open("rb") as fh:
                        z.writestr(f"{person}/{d.doc_type}/{i:02d}_{_safe(d.original_name)}", fh.read())
                except FileNotFoundError:
                    continue
        tmp.seek(0)
        resp = FileResponse(tmp, as_attachment=True, filename=f"{person}.zip")
        resp["Cache-Control"] = "private, no-store"
        return resp


class DashboardView(APIView):
    """GET /api/admin/dashboard/ — arizalar soni (holat bo'yicha)."""

    permission_classes = [ApplicationsAccess]
    section = "applications"

    def get(self, request):
        qs = Application.objects.filter(is_submitted=True)
        user = request.user
        if not (user.is_platform_admin or user.perm("applications")):
            qs = qs.filter(university_id=user.university_id)
        counts = {row["status"]: row["n"] for row in qs.values("status").annotate(n=Count("id"))}
        return Response(
            {
                "applications": {
                    "new": counts.get("new", 0),
                    "reviewing": counts.get("reviewing", 0),
                    "accepted": counts.get("accepted", 0),
                    "rejected": counts.get("rejected", 0),
                    "total": sum(counts.values()),
                }
            }
        )


# ----------------------------------------------------------------- murojaatlar (bosh sahifa formasi)


class InquiryCreateView(APIView):
    """POST /api/public/inquiries/ — "Savollaringiz bormi?" formasi."""

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "inquiries"

    def post(self, request):
        if (request.data.get("website") or "").strip():  # honeypot
            return Response({"ok": True}, status=status.HTTP_201_CREATED)
        ser = InquirySerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        obj = ser.save()
        self._notify(obj)
        return Response({"ok": True}, status=status.HTTP_201_CREATED)

    @staticmethod
    def _notify(obj):
        from apps.content.models import SiteSettings

        to = SiteSettings.objects.values_list("contact_email", flat=True).first() or ""
        if not to:
            return
        try:
            send_mail(
                subject=f"Yangi murojaat: {obj.name}",
                message=(
                    f"Ism: {obj.name}\nEmail: {obj.email}\nTelefon: {obj.phone}\n"
                    f"Qiziqiş: {obj.get_interest_display()}\n\n{obj.message}\n\n(Admin panel \u2192 Murojaatlar)"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[to],
                fail_silently=True,
            )
        except Exception:  # pragma: no cover
            logger.exception("Murojaat xabarini yuborib bölmadi")


class AdminInquiryViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """Murojaatlar: faqat platforma administratori. O'zgartirish — faqat 'ko'rib chiqildi' belgisi."""

    permission_classes = [SectionPermission]
    section = "inquiries"
    serializer_class = InquirySerializer
    queryset = Inquiry.objects.all()
    filterset_fields = ["is_handled", "interest"]
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def get_serializer_class(self):
        return InquiryAdminSerializer

    def perform_update(self, serializer):
        old = serializer.instance.reply
        new = serializer.validated_data.get("reply", old)
        extra = {}
        if "reply" in serializer.validated_data and new.strip() and new != old:
            extra = {"replied_at": timezone.now(), "replied_by": self.request.user, "is_handled": True}
        obj = serializer.save(**extra)
        if extra:
            self._notify_user(obj)

    @staticmethod
    def _notify_user(obj):
        link = f"{getattr(settings, 'PUBLIC_WEB_URL', 'http://127.0.0.1:3010').rstrip('/')}/uz/cabinet"
        try:
            send_mail(
                subject="UzJapan — murojaatingizga javob berildi",
                message=f"Salom, {obj.name}!\n\nMurojaatingizga javob berildi. Uni kabinetingizda körişingiz mumkin:\n{link}\n\nJavob:\n{obj.reply}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[obj.email],
                fail_silently=True,
            )
        except Exception:  # pragma: no cover
            logger.exception("Javob xabarini yuborib bölmadi")
