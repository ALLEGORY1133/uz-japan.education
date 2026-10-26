"""Parolni tiklash: email orqali bir martalik havola (muddati PASSWORD_RESET_TIMEOUT soniya)."""
import logging

from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.db.models import Q
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .models import User
from .security import unlock

logger = logging.getLogger(__name__)
GENERIC = "Agar bunday hisob mavjud va unga email biriktirilgan bölsa, parolni tiklaş havolasi yuborildi."


class ForgotPasswordView(APIView):
    """POST /api/admin/auth/forgot/ {identifier: login yoki email}. Hisob bor-yo'qligini oshkor qilmaydi."""

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "pwreset"

    def post(self, request):
        ident = str(request.data.get("identifier", "")).strip()[:254]
        if ident:
            users = User.objects.filter(is_active=True).exclude(email="").filter(Q(username__iexact=ident) | Q(email__iexact=ident))
            for u in users[:3]:
                if not (u.is_platform_admin or (u.is_university_rep and u.university_id)):
                    continue
                uid = urlsafe_base64_encode(force_bytes(u.pk))
                token = default_token_generator.make_token(u)
                link = f"{settings.ADMIN_URL.rstrip('/')}/reset?uid={uid}&token={token}"
                hours = max(1, settings.PASSWORD_RESET_TIMEOUT // 3600)
                try:
                    send_mail(
                        subject="UzJapan Admin — parolni tiklaş",
                        message=(
                            f"Salom, {u.get_full_name() or u.username}!\n\n"
                            f"Parolni tiklaş uçun quyidagi havolaga öting (havola {hours} soat amal qiladi va bir marta işlaydi):\n{link}\n\n"
                            "Agar buni siz söramagan bölsangiz, bu xatni e’tiborsiz qoldiring — parolingiz özgarmaydi."
                        ),
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[u.email],
                    )
                except Exception:  # pragma: no cover
                    logger.exception("Parol tiklaş xatini yuborib bölmadi")
        return Response({"detail": GENERIC})


class ResetPasswordSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    password = serializers.CharField(write_only=True, min_length=8, max_length=128)


class ResetPasswordView(APIView):
    """POST /api/admin/auth/reset/ {uid, token, password}."""

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "pwreset_confirm"

    def post(self, request):
        ser = ResetPasswordSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        bad = Response({"detail": "Havola yaroqsiz yoki muddati tugagan. Parolni tiklaşni qaytadan sörang."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(pk=force_str(urlsafe_base64_decode(ser.validated_data["uid"])), is_active=True)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            return bad
        if not default_token_generator.check_token(user, ser.validated_data["token"]):
            return bad
        try:
            validate_password(ser.validated_data["password"], user)
        except DjangoValidationError as e:
            return Response({"password": list(e.messages)}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(ser.validated_data["password"])
        user.save()  # parol o'zgargani uchun token avtomatik yaroqsiz bo'ladi
        unlock(user.username)
        return Response({"detail": "Parol yangilandi. Endi yangi parol bilan kiring."})
