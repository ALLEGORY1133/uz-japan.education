"""Talaba kabineti: email orqali kirish (ixtiyoriy: emailga kelgan bir martalik kod), ariza holati va murojaatlar/javoblar.

Sessiya — imzolangan token (12 soat). CABINET_REQUIRE_CODE=1 bo'lsa, token faqat emailga yuborilgan kod kiritilgach beriladi.
"""
import hashlib
import hmac
import logging
import time

from django.conf import settings
from django.core import signing
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers, status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .models import Application, Inquiry
from .serializers import ApplicationDocumentSerializer

logger = logging.getLogger(__name__)
SALT = "uzjapan.cabinet"
TOKEN_AGE = 12 * 3600
CODE_WINDOW = 600  # soniya


def _require_code():
    return str(getattr(settings, "CABINET_REQUIRE_CODE", "0")) == "1"


def _norm_email(raw):
    email = str(raw or "").strip().lower()[:254]
    try:
        validate_email(email)
    except DjangoValidationError:
        raise serializers.ValidationError({"email": "Email notöğri."})
    return email


def make_token(email):
    return signing.dumps({"e": email}, salt=SALT)


def email_from_request(request):
    raw = request.headers.get("X-Cabinet-Token", "")
    try:
        return signing.loads(raw, salt=SALT, max_age=TOKEN_AGE)["e"]
    except Exception:
        raise AuthenticationFailed("Sessiya tugagan. Emailni qaytadan kiriting.")


def _code_for(email, window):
    msg = f"{email}:{window}".encode()
    digest = hmac.new(settings.SECRET_KEY.encode(), msg, hashlib.sha256).digest()
    return f"{int.from_bytes(digest[:4], 'big') % 1_000_000:06d}"


def _valid_code(email, code):
    now = int(time.time() // CODE_WINDOW)
    return any(hmac.compare_digest(_code_for(email, w), str(code).strip()) for w in (now, now - 1))


class CabinetLoginView(APIView):
    """POST /api/public/cabinet/login/ {email} → {token} yoki (kod rejimida) {need_code: true}."""

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "cabinet"

    def post(self, request):
        email = _norm_email(request.data.get("email"))
        if not _require_code():
            return Response({"token": make_token(email), "email": email})
        code = _code_for(email, int(time.time() // CODE_WINDOW))
        try:
            send_mail(
                subject="UzJapan — kabinetga kiriş kodi",
                message=f"Kabinetga kiriş kodingiz: {code}\n\nKod {CODE_WINDOW // 60}–{CODE_WINDOW // 30} daqiqa amal qiladi. Buni siz söramagan bölsangiz, xatni e’tiborsiz qoldiring.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
            )
        except Exception:  # pragma: no cover
            logger.exception("Kabinet kodini yuborib bölmadi")
        return Response({"need_code": True, "email": email})


class CabinetVerifyView(APIView):
    """POST /api/public/cabinet/verify/ {email, code} → {token}."""

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "cabinet_verify"

    def post(self, request):
        email = _norm_email(request.data.get("email"))
        if not _valid_code(email, request.data.get("code", "")):
            return Response({"code": "Kod notöğri yoki muddati tugagan."}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"token": make_token(email), "email": email})


def _inquiry_row(i):
    return {
        "id": i.id, "interest": i.interest, "interest_label": i.get_interest_display(), "message": i.message,
        "created_at": i.created_at, "reply": i.reply, "replied_at": i.replied_at,
    }


class CabinetMeView(APIView):
    """GET /api/public/cabinet/me/ — shu emailga tegishli arizalar va murojaatlar (javoblar bilan)."""

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "cabinet_read"

    def get(self, request):
        email = email_from_request(request)
        apps = Application.objects.select_related("university").prefetch_related("documents").filter(email__iexact=email, is_submitted=True).order_by("-created_at")
        inqs = Inquiry.objects.filter(email__iexact=email)
        return Response({
            "email": email,
            "applications": [{
                "code": a.tracking_code, "university": a.university.name, "status": a.status,
                "degree": a.degree, "funding": a.funding, "submitted_at": a.submitted_at,
                "documents": ApplicationDocumentSerializer(a.documents.all(), many=True).data,
            } for a in apps],
            "inquiries": [_inquiry_row(i) for i in inqs],
        })


class CabinetInquiryView(APIView):
    """POST /api/public/cabinet/inquiries/ {message, interest} — kabinetdan yangi murojaat."""

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "inquiries"

    def post(self, request):
        email = email_from_request(request)
        message = str(request.data.get("message", "")).strip()[:2000]
        if len(message) < 3:
            return Response({"message": "Xabarni yozing."}, status=status.HTTP_400_BAD_REQUEST)
        interest = request.data.get("interest") or Inquiry.Interest.OTHER
        if interest not in Inquiry.Interest.values:
            interest = Inquiry.Interest.OTHER
        last = Application.objects.filter(email__iexact=email).order_by("-created_at").first()
        name = (f"{last.first_name} {last.last_name}".strip() if last else "") or email.split("@")[0]
        obj = Inquiry.objects.create(name=name[:120], email=email, interest=interest, message=message)
        from .views import InquiryCreateView

        InquiryCreateView._notify(obj)
        return Response(_inquiry_row(obj), status=status.HTTP_201_CREATED)
