"""Admin harakatlari tarixi.

Middleware /api/admin/ ga kelgan yozuvchi so'rovlarda foydalanuvchini aniqlaydi (JWT),
Django signal'lari esa modellarning qo'shilishi / o'zgarishi / o'chirilishini yozib boradi.
Ommaviy sayt so'rovlari (talaba arizasi va h.k.) tarixga yozilmaydi.
"""
import logging
import threading

from django.db.models import FileField
from django.db.models.signals import post_delete, post_save, pre_delete, pre_save

log = logging.getLogger(__name__)
_state = threading.local()

TRACKED_APPS = {"universities", "content", "applications", "accounts"}
SKIP_FIELDS = {"updated_at", "created_at", "last_login"}


def set_context(user, ip, path):
    _state.ctx = {"user": user, "ip": ip, "path": path}
    _state.pending = set()


def clear_context():
    _state.ctx = None
    _state.pending = set()


def _ctx():
    return getattr(_state, "ctx", None)


def _pending():
    if not hasattr(_state, "pending"):
        _state.pending = set()
    return _state.pending


def _tracked(sender):
    return sender._meta.app_label in TRACKED_APPS and _ctx() is not None


def _short(v):
    if v is None:
        return ""
    s = str(v)
    return s if len(s) <= 160 else s[:157] + "…"


def _snapshot(obj):
    out = {}
    for f in obj._meta.concrete_fields:
        if f.name in SKIP_FIELDS:
            continue
        val = getattr(obj, f.attname, None)
        if isinstance(f, FileField):
            val = getattr(val, "name", val) or ""
        out[f.attname] = (str(f.verbose_name), "password" if f.name == "password" else None, _short(val))
    return out


def write(action, model, object_id="", object_repr="", changes=None):
    ctx = _ctx()
    if not ctx:
        return
    from .models import AuditLog

    user = ctx["user"]
    try:
        AuditLog.objects.create(
            user=user if getattr(user, "pk", None) else None,
            user_label=getattr(user, "username", "")[:150],
            action=action,
            model_key=model._meta.label_lower[:80],
            model_label=str(model._meta.verbose_name).capitalize()[:120],
            object_id=str(object_id or "")[:40],
            object_repr=_short(object_repr)[:200],
            changes=changes or [],
            ip=ctx["ip"],
            path=(ctx["path"] or "")[:200],
        )
    except Exception:  # tarix yozilmasa ham asosiy amal buzilmasin
        log.exception("AuditLog yozib bo'lmadi")


def _on_pre_save(sender, instance, raw=False, **kw):
    if raw or not _tracked(sender):
        return
    old = None
    if instance.pk:
        prev = sender._default_manager.filter(pk=instance.pk).first()
        old = _snapshot(prev) if prev else None
    instance._audit_old = old


def _on_post_save(sender, instance, created, raw=False, update_fields=None, **kw):
    if raw or not _tracked(sender):
        return
    if created:
        write("create", sender, instance.pk, str(instance))
        return
    if update_fields and set(update_fields) <= {"sort_order", "updated_at"}:
        return  # tartib o'zgarishi alohida yoziladi
    old = getattr(instance, "_audit_old", None)
    new = _snapshot(instance)
    diff = []
    for key, (label, kind, val) in new.items():
        if old is None:
            break
        if old[key][2] != val:
            if kind == "password":
                diff.append({"f": label, "old": "•••", "new": "•••"})
            else:
                diff.append({"f": label, "old": old[key][2], "new": val})
    if old is not None and not diff:
        return
    write("update", sender, instance.pk, str(instance), diff)


def _on_pre_delete(sender, instance, **kw):
    if not _tracked(sender):
        return
    _pending().add((sender._meta.label, str(instance.pk)))
    try:
        instance._audit_repr = str(instance)
    except Exception:
        instance._audit_repr = ""


def _on_post_delete(sender, instance, **kw):
    if not _tracked(sender):
        return
    me = (sender._meta.label, str(instance.pk))
    pend = _pending()
    # Ota yozuv bilan birga o'chgan bolalar (kaskad) alohida yozilmaydi
    for f in instance._meta.concrete_fields:
        if f.is_relation and f.many_to_one and getattr(instance, f.attname, None) is not None:
            if (f.related_model._meta.label, str(getattr(instance, f.attname))) in pend:
                pend.discard(me)
                return
    pend.discard(me)
    write("delete", sender, instance.pk, getattr(instance, "_audit_repr", ""))


def connect():
    pre_save.connect(_on_pre_save, dispatch_uid="audit_pre_save")
    post_save.connect(_on_post_save, dispatch_uid="audit_post_save")
    pre_delete.connect(_on_pre_delete, dispatch_uid="audit_pre_delete")
    post_delete.connect(_on_post_delete, dispatch_uid="audit_post_delete")
