from django.shortcuts import get_object_or_404
from rest_framework import serializers
from rest_framework.exceptions import NotFound
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import SectionPermission
from apps.core.serializers import AdminModelSerializer

from .models import PageBlock
from .page_registry import LANGS, PAGES, SECTIONS

TEXT_FIELDS = [f"{b}_{l}" for b in ("title", "text", "link_label") for l in LANGS] + ["link_url"]


class PageBlockSerializer(AdminModelSerializer):
    class Meta:
        model = PageBlock
        fields = TEXT_FIELDS + ["image", "video", "updated_at"]


def _values(block, request):
    if not block:
        return {}
    return PageBlockSerializer(block, context={"request": request}).data


class AdminPagesView(APIView):
    """GET: sahifalar va bo'limlar (joriy qiymatlari bilan)."""

    permission_classes = [SectionPermission]
    section = "pages"

    def get(self, request):
        blocks = {b.key: b for b in PageBlock.objects.all()}
        pages = []
        for p in PAGES:
            secs = []
            for s in p["sections"]:
                b = blocks.get(s["key"])
                secs.append({**s, "customized": bool(b), "values": _values(b, request)})
            pages.append({"key": p["key"], "label": p["label"], "path": p["path"], "sections": secs})
        return Response({"pages": pages})


class AdminPageSectionView(APIView):
    """PATCH (multipart): matn/havola/rasm/video; `clear_image` / `clear_video` = 1 — o'chirish. DELETE: standartga qaytarish."""

    permission_classes = [SectionPermission]
    section = "pages"
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _sec(self, key):
        if key not in SECTIONS:
            raise NotFound("Bunday bölim yöq.")
        return SECTIONS[key]

    def patch(self, request, key):
        sec = self._sec(key)
        allowed = set(sec["fields"])
        block = PageBlock.objects.filter(key=key).first() or PageBlock(key=key)
        data = {}
        for k in TEXT_FIELDS:
            base = k.rsplit("_", 1)[0] if k != "link_url" else "link"
            if k in request.data and base in allowed:
                data[k] = request.data.get(k) or ""
        files = {}
        for f in ("image", "video"):
            if f in request.FILES and f in allowed:
                files[f] = request.FILES[f]
        ser = PageBlockSerializer(block, data={**data, **files}, partial=True, context={"request": request})
        ser.is_valid(raise_exception=True)
        obj = ser.save(key=key)
        for f in ("image", "video"):
            if str(request.data.get(f"clear_{f}", "")) in ("1", "true", "True") and f in allowed and f not in files:
                getattr(obj, f).delete(save=False)
                setattr(obj, f, "")
        obj.save()
        return Response({**sec, "customized": True, "values": _values(obj, request)})

    def delete(self, request, key):
        self._sec(key)
        PageBlock.objects.filter(key=key).delete()
        return Response(status=204)


class PublicBlocksView(APIView):
    """GET /api/public/blocks/ — {kalit: {title:{uz,en,ja}, text:{...}, link_label:{...}, link_url, image, video}} (faqat to'ldirilganlari)."""

    permission_classes = [AllowAny]

    def get(self, request):
        out = {}
        for b in PageBlock.objects.all():
            if b.key not in SECTIONS:
                continue
            item = {
                "title": {l: getattr(b, f"title_{l}") for l in LANGS},
                "text": {l: getattr(b, f"text_{l}") for l in LANGS},
                "link_label": {l: getattr(b, f"link_label_{l}") for l in LANGS},
                "link_url": b.link_url,
                "image": b.image.url if b.image else None,
                "video": b.video.url if b.video else None,
            }
            out[b.key] = item
        return Response(out)
