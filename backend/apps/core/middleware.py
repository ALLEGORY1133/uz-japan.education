from django.utils import translation

SUPPORTED = ("uz", "ja", "en")


class ApiLanguageMiddleware:
    """Tilni ?lang=uz|ja|en yoki Accept-Language sarlavhasidan aniqlaydi."""

    def __init__(self, get_response):
        self.get_response = get_response

    @staticmethod
    def _from_header(request):
        header = request.META.get("HTTP_ACCEPT_LANGUAGE", "")
        for part in header.split(","):
            code = part.split(";")[0].strip()[:2].lower()
            if code in SUPPORTED:
                return code
        return None

    def __call__(self, request):
        lang = request.GET.get("lang") or self._from_header(request)
        if lang not in SUPPORTED:
            lang = "uz"
        translation.activate(lang)
        request.LANGUAGE_CODE = lang
        response = self.get_response(request)
        response["Content-Language"] = lang
        return response


class AuditContextMiddleware:
    """/api/admin/ dagi yozuvchi so'rovlarda kim bajarayotganini aniqlaydi (tarix uchun)."""

    SAFE = {"GET", "HEAD", "OPTIONS"}

    def __init__(self, get_response):
        self.get_response = get_response

    @staticmethod
    def _ip(request):
        xff = request.META.get("HTTP_X_FORWARDED_FOR", "")
        return xff.split(",")[0].strip() if xff else request.META.get("REMOTE_ADDR")

    def __call__(self, request):
        from . import audit

        if (
            request.method not in self.SAFE
            and request.path.startswith("/api/admin/")
            and not request.path.startswith("/api/admin/auth/")
        ):
            user = None
            try:
                from rest_framework_simplejwt.authentication import JWTAuthentication

                res = JWTAuthentication().authenticate(request)
                user = res[0] if res else None
            except Exception:
                user = None
            if user is not None:
                ip = self._ip(request)
                try:
                    from ipaddress import ip_address

                    ip_address(ip or "")
                except ValueError:
                    ip = None
                audit.set_context(user, ip, request.path)
        try:
            return self.get_response(request)
        finally:
            audit.clear_context()
