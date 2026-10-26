"""Kirishni brute-force'dan himoya: hisob va IP bo'yicha vaqtincha bloklash."""
from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from .models import LoginAttempt

MAX_USER_FAILS = int(getattr(settings, "LOGIN_MAX_FAILS", 5))      # bitta login uchun
MAX_IP_FAILS = int(getattr(settings, "LOGIN_MAX_FAILS_IP", 30))    # bitta IP uchun
WINDOW = timedelta(minutes=int(getattr(settings, "LOGIN_WINDOW_MINUTES", 15)))
LOCK = timedelta(minutes=int(getattr(settings, "LOGIN_LOCK_MINUTES", 15)))


def client_ip(request):
    fwd = request.META.get("HTTP_X_FORWARDED_FOR", "")
    ip = fwd.split(",")[0].strip() if fwd else request.META.get("REMOTE_ADDR", "")
    return ip or None


def norm(username):
    return str(username or "").strip().lower()[:150]


def _remaining(qs, limit):
    since = timezone.now() - max(WINDOW, LOCK)
    recent = list(qs.filter(success=False, created_at__gte=since).order_by("-created_at").values_list("created_at", flat=True)[:limit])
    if len(recent) < limit:
        return 0
    left = (recent[0] + LOCK - timezone.now()).total_seconds()
    return max(0, int(left) + 1) if left > 0 else 0


def lock_seconds(username, ip):
    """Bloklangan bo'lsa — necha soniya qolgani; aks holda 0."""
    wait = _remaining(LoginAttempt.objects.filter(username=username), MAX_USER_FAILS) if username else 0
    if ip:
        wait = max(wait, _remaining(LoginAttempt.objects.filter(ip=ip), MAX_IP_FAILS))
    return wait


def attempts_left(username):
    since = timezone.now() - WINDOW
    n = LoginAttempt.objects.filter(username=username, success=False, created_at__gte=since).count()
    return max(0, MAX_USER_FAILS - n)


def record(username, ip, ok):
    LoginAttempt.objects.create(username=username, ip=ip, success=ok)
    if ok:
        LoginAttempt.objects.filter(username=username, success=False).delete()
    # eski yozuvlarni vaqti-vaqti bilan tozalash
    if LoginAttempt.objects.count() % 50 == 0:
        LoginAttempt.objects.filter(created_at__lt=timezone.now() - timedelta(days=7)).delete()


def unlock(username):
    LoginAttempt.objects.filter(username=norm(username)).delete()
