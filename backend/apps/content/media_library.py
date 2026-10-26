"""Media kutubxonasi (faqat platforma administratori): barcha yuklangan rasm/video bir joyda.

GET    /api/admin/media-library/                 — ro'yxat
PATCH  /api/admin/media-library/<manba>/<id>/    — faylni almashtirish (file + quality)
DELETE /api/admin/media-library/<manba>/<id>/    — o'chirish
"""
import os

from django.core.exceptions import ValidationError as DjangoValidationError
from PIL import Image
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.images import optimize_upload
from apps.core.permissions import IsPlatformAdmin
from apps.universities.models import University, UniversityMedia

from .models import HeroSlide, HeroSlideImage, News, NewsMedia, SiteMedia

# manba: (model, maydon, o'chirganda yozuvning o'zi ham o'chadimi, yorliq maydoni)
SOURCES = {
    "hero_image": (HeroSlide, "image", False, "Bosh sahifa slaydi · rasm"),
    "hero_video": (HeroSlide, "video", False, "Bosh sahifa slaydi · video"),
    "hero_extra": (HeroSlideImage, "image", True, "Slayd qo‘shimcha rasmi"),
    "site_image": (SiteMedia, "image", False, "Sayt media · rasm"),
    "site_video": (SiteMedia, "video", False, "Sayt media · video"),
    "news_cover": (News, "cover", False, "Yangilik muqovasi"),
    "news_media": (NewsMedia, "file", True, "Yangilik galereyasi"),
    "uni_logo": (University, "logo", False, "Universitet logotipi"),
    "uni_banner": (University, "banner", False, "Universitet banneri"),
    "uni_media": (UniversityMedia, "file", True, "Universitet galereyasi"),
}
VIDEO_EXT = (".mp4", ".webm")


def _label(obj):
    for attr in ("title", "name", "slug", "caption"):
        v = getattr(obj, attr, "")
        if v:
            return str(v)[:80]
    for rel in ("slide", "news", "university"):
        parent = getattr(obj, rel, None)
        if parent is not None:
            return _label(parent)
    return f"#{obj.pk}"


def _info(request, source, obj):
    _model, field, _rec, kind_label = SOURCES[source]
    f = getattr(obj, field)
    if not f:
        return None
    try:
        size = f.size
    except (FileNotFoundError, OSError, ValueError):
        size = None
    is_video = f.name.lower().endswith(VIDEO_EXT)
    width = height = None
    if not is_video:
        try:
            with Image.open(f.path) as im:
                width, height = im.size
        except Exception:
            pass
    return {
        "source": source,
        "id": obj.pk,
        "kind": "video" if is_video else "image",
        "url": f.url,
        "name": os.path.basename(f.name),
        "size": size,
        "width": width,
        "height": height,
        "label": _label(obj),
        "where": kind_label,
    }


class MediaLibraryView(APIView):
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        items = []
        for source, (model, _field, _rec, _lbl) in SOURCES.items():
            for obj in model.objects.all():
                info = _info(request, source, obj)
                if info:
                    items.append(info)
        return Response(items)


class MediaLibraryItemView(APIView):
    permission_classes = [IsPlatformAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def _get(self, source, pk):
        if source not in SOURCES:
            raise NotFound()
        model, field, record, _ = SOURCES[source]
        try:
            return model.objects.get(pk=pk), field, record
        except model.DoesNotExist:
            raise NotFound()

    def patch(self, request, source, pk):
        obj, field, _record = self._get(source, pk)
        up = request.FILES.get("file")
        if not up:
            raise ValidationError({"file": "Fayl tanlang."})
        model_field = obj._meta.get_field(field)
        is_video_field = field == "video"
        if is_video_field != up.name.lower().endswith(VIDEO_EXT) and field in ("image", "cover", "logo", "banner", "video"):
            raise ValidationError({"file": "Fayl turi mos emas (rasm o‘rniga rasm, video o‘rniga video yuklang)."})
        up = optimize_upload(up, request.data.get("quality") or "high")
        try:
            for v in model_field.validators:
                v(up)
        except DjangoValidationError as e:
            raise ValidationError({"file": e.messages})
        old = getattr(obj, field)
        old_name = old.name if old else None
        getattr(obj, field).save(up.name, up, save=True)
        if old_name and old_name != getattr(obj, field).name:
            old.storage.delete(old_name)
        return Response(_info(request, source, obj))

    def delete(self, request, source, pk):
        obj, field, record = self._get(source, pk)
        f = getattr(obj, field)
        if f:
            f.delete(save=False)
        if record:
            obj.delete()
        else:
            setattr(obj, field, "")
            if source == "hero_image" or source == "hero_video":
                obj.media_kind = "none"
            obj.save()
        return Response(status=204)
