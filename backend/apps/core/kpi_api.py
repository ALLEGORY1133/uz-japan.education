import csv
from collections import defaultdict
from datetime import date, timedelta

from django.db.models import Count, Q
from django.http import HttpResponse
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.applications.models import Application, ApplicationDocument
from apps.core.models import AuditLog
from apps.core.permissions import SectionPermission

REQUIRED_DOCS = {"passport", "diploma", "transcript", "motivation"}
SLA_DAYS = 3
APPS_TARGET = 20      # oylik topshirilgan arizalar maqsadi
REP_TARGET = 10       # universitet vakili: oyiga audit amallari
ADMIN_TARGET = 20     # kontent administratori: oyiga audit amallari
GROUP_LABEL = {"content_admins": "Kontent admini", "university_reps": "Universitet vakili"}


def _period(request):
    today = timezone.localdate()
    raw = request.query_params.get("month", "")
    try:
        y, m = [int(x) for x in raw.split("-")]
        start = date(y, m, 1)
    except (ValueError, TypeError):
        start = today.replace(day=1)
    end = (start.replace(day=28) + timedelta(days=4)).replace(day=1)
    return start, end


def _pct(a, b):
    return round(min(100, max(0, (a / b * 100) if b else 0)))


def _is_admin_q(prefix=""):
    """Platforma administratori: roli bo'yicha yoki superuser (User.is_platform_admin bilan bir xil)."""
    return Q(**{f"{prefix}role": User.Role.PLATFORM_ADMIN}) | Q(**{f"{prefix}is_superuser": True})


def build_kpi(request):
    start, end = _period(request)
    apps = Application.objects.filter(created_at__date__gte=start, created_at__date__lt=end)
    submitted = apps.filter(is_submitted=True)
    n_sub = submitted.count()
    reviewed = submitted.filter(
        status__in=[Application.Status.REVIEWING, Application.Status.ACCEPTED, Application.Status.REJECTED]
    )
    n_rev = reviewed.count()
    closed = submitted.filter(status__in=[Application.Status.ACCEPTED, Application.Status.REJECTED]).count()

    # Muddat: updated_at birinchi ko'rib chiqish vaqti emas — shuning uchun faqat taxminiy ko'rsatkich (proksi)
    within_sla = sum(
        1
        for a in reviewed.only("submitted_at", "updated_at")
        if a.submitted_at and a.updated_at and (a.updated_at - a.submitted_at).total_seconds() <= SLA_DAYS * 86400
    )
    timeliness = _pct(within_sla, n_rev)

    # To'liqlik: bitta so'rovda barcha arizalarning hujjat turlari
    types_by_app = defaultdict(set)
    for app_id, dt in ApplicationDocument.objects.filter(application__in=submitted).values_list("application_id", "doc_type"):
        types_by_app[app_id].add(dt)
    complete = sum(1 for app_id in submitted.values_list("id", flat=True) if REQUIRED_DOCS <= types_by_app[app_id])
    completeness = _pct(complete, n_sub)
    throughput = _pct(n_sub, APPS_TARGET)
    admission_score = round(timeliness * 0.4 + completeness * 0.4 + throughput * 0.2) if n_sub else 0

    logs = AuditLog.objects.filter(created_at__date__gte=start, created_at__date__lt=end)
    per_user = dict(logs.exclude(user__isnull=True).values_list("user_id").annotate(n=Count("id")))
    rows = []
    for u in User.objects.filter(is_active=True).select_related("university"):
        if u.is_platform_admin:
            group, target = "content_admins", ADMIN_TARGET
        elif u.is_university_rep:
            group, target = "university_reps", REP_TARGET
        else:
            continue
        actions = per_user.get(u.id, 0)
        rows.append({
            "id": u.id, "name": u.get_full_name() or u.username, "username": u.username,
            "university": u.university.name if u.university_id else "",
            "group": group, "actions": actions, "target": target, "score": _pct(actions, target),
        })
    rows.sort(key=lambda x: (-x["score"], -x["actions"], x["name"].lower()))
    for i, r in enumerate(rows, 1):
        r["rank"] = i

    admin_actions = sum(r["actions"] for r in rows if r["group"] == "content_admins")
    rep_actions = sum(r["actions"] for r in rows if r["group"] == "university_reps")
    n_admins = sum(1 for r in rows if r["group"] == "content_admins")
    n_reps = sum(1 for r in rows if r["group"] == "university_reps")

    # Xavfsizlik: endi har bir hujjatning skan natijasi saqlanadi (ApplicationDocument.scan_status / lang_checked)
    docs = ApplicationDocument.objects.filter(created_at__date__gte=start, created_at__date__lt=end)
    n_docs = docs.count()
    n_clean = docs.filter(scan_status="clean").count()
    n_skipped = n_docs - n_clean
    motiv = docs.filter(doc_type="motivation")
    n_motiv = motiv.count()
    n_motiv_ok = motiv.filter(lang_checked=True).count()
    security_score = _pct(n_clean, n_docs) if n_docs else None

    cards = [
        {"key": "admissions", "name": "Qabul komissiyasi", "score": admission_score, "volume": n_sub, "target": APPS_TARGET,
         "metrics": [
             {"label": "Arizalar yuborilgan", "value": n_sub},
             {"label": f"{SLA_DAYS} kun içida körib çiqiş (proksi)", "value": f"{timeliness}%"},
             {"label": "Majburiy hujjatlar töliqligi", "value": f"{completeness}%"}],
         "formula": f"40% muddat (submitted_at → updated_at proksi, {SLA_DAYS} kun), 40% majburiy hujjatlar töliqligi, 20% hajm ({APPS_TARGET} ariza/oy maqsad)."},
        {"key": "university_reps", "name": "Universitet vakillari", "score": _pct(rep_actions, REP_TARGET * n_reps) if n_reps else 0, "volume": rep_actions, "target": REP_TARGET,
         "metrics": [{"label": "Auditda qayd etilgan amallar", "value": rep_actions}, {"label": "Faol vakillar", "value": n_reps}],
         "formula": f"Jami amallar / (faol vakillar × {REP_TARGET} amal/oy). Bu sifat yoki javob tezligini ölçamaydi."},
        {"key": "content_admins", "name": "Kontent administratorlari", "score": _pct(admin_actions, ADMIN_TARGET * n_admins) if n_admins else 0, "volume": admin_actions, "target": ADMIN_TARGET,
         "metrics": [{"label": "Auditda qayd etilgan amallar", "value": admin_actions}, {"label": "Faol administratorlar", "value": n_admins}],
         "formula": f"Jami amallar / (faol administratorlar × {ADMIN_TARGET} amal/oy). Sifat uçun tasdiqlaş/rollback hodisalari alohida kuzatilişi kerak."},
        {"key": "security", "name": "Tizim xavfsizligi", "score": security_score, "volume": n_docs, "target": None,
         "metrics": [
             {"label": "Yuklangan hujjatlar", "value": n_docs},
             {"label": "Virus skaneridan ötgan", "value": n_clean},
             {"label": "Skaner öçiq paytda yuklangan", "value": n_skipped},
             {"label": "Yapon tili tasdiqlangan xatlar", "value": f"{n_motiv_ok}/{n_motiv}"}],
         "formula": "Skaner (ClamAV) toza deb topgan hujjatlar uluşi. Virus topilgan fayllar saqlanmaydi, şuning uçun bu körsatkiçga kirmaydi."},
    ]
    return {
        "month": start.strftime("%Y-%m"), "period_start": start.isoformat(), "period_end": (end - timedelta(days=1)).isoformat(),
        "cards": cards, "ranking": rows,
        "applications": {"submitted": n_sub, "reviewed": n_rev, "closed": closed},
        "notes": [
            "KPI natijalari faqat tizimda saqlangan ma’lumotlarga asoslanadi.",
            "updated_at birinçi körib çiqiş vaqtini saqlamaydi; muddat körsatkiçi taxminiy proksi.",
            "Reyting audit amallari soniga asoslanadi; bu yakka özi iş sifati degani emas.",
        ],
    }


class KPIDashboardView(APIView):
    """Oylik KPI (saqlangan ariza, hujjat va audit ma’lumotlari asosida). Faqat platforma administratori."""

    permission_classes = [SectionPermission]
    section = "kpi"

    def get(self, request):
        return Response(build_kpi(request))


class KPIExportView(APIView):
    permission_classes = [SectionPermission]
    section = "kpi"

    @staticmethod
    def _safe(v):
        """CSV/Excel formulasi inyeksiyasidan himoya: = + - @ bilan boshlangan matn oldiga ' qo'yiladi."""
        s = "" if v is None else str(v)
        return "'" + s if s[:1] in ("=", "+", "-", "@") else s

    def get(self, request):
        data = build_kpi(request)
        resp = HttpResponse(content_type="text/csv; charset=utf-8")
        resp["Content-Disposition"] = f'attachment; filename="uzjapan-kpi-{data["month"]}.csv"'
        resp.write("﻿")
        w = csv.writer(resp)
        w.writerow(["Oy", data["month"]])
        w.writerow([])
        w.writerow(["Guruh", "Ball", "Hajm", "Maqsad", "Formula"])
        for c in data["cards"]:
            w.writerow([c["name"], c["score"] if c["score"] is not None else "Hisoblanmaydi", c["volume"], c["target"] if c["target"] is not None else "", c["formula"]])
        w.writerow([])
        w.writerow(["Reyting", "Foydalanuvçi", "Universitet", "Guruh", "Audit amallari", "Maqsad", "Ball"])
        for r in data["ranking"]:
            w.writerow([r["rank"], self._safe(r["name"]), self._safe(r["university"]), GROUP_LABEL.get(r["group"], r["group"]), r["actions"], r["target"], r["score"]])
        return resp
