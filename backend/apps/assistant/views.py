from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.core.permissions import IsAnyStaff

from .engine import admin_answer, public_answer


class PublicAssistantView(APIView):
    """POST /api/public/assistant/ {message, lang} — faqat ochiq ma'lumot."""

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "assistant"

    def post(self, request):
        return Response(public_answer(request.data.get("message", ""), str(request.data.get("lang", "uz"))[:2]))


class AdminAssistantView(APIView):
    """POST /api/admin/assistant/ {message} — rolga qarab arizalar/murojaatlar/statistika."""

    permission_classes = [IsAnyStaff]

    def post(self, request):
        return Response(admin_answer(request.data.get("message", ""), request.user))
