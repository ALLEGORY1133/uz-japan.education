"""Yuklangan rasmlarni sifatli va yengil holatga keltiradi.

Sifat darajalari (admin yuklashda `quality` maydoni bilan tanlanadi):
  original — fayl o'zgartirilmaydi
  high     — eng uzun tomon 2560 px, JPEG 90 (standart)
  medium   — 1600 px, JPEG 80
  web      — 1200 px, JPEG 72 (eng yengil)
EXIF aylantirish bajariladi; kattalashtirilmaydi; PNG shaffoflik saqlanadi;
WebP/AVIF/GIF o'zgartirilmaydi.
"""
import io
import os

from django.core.files.uploadedfile import InMemoryUploadedFile
from PIL import Image, ImageOps

PRESETS = {
    "high": (2560, 90),
    "medium": (1600, 80),
    "web": (1200, 72),
}
DEFAULT_QUALITY = "high"


def optimize_upload(f, quality=DEFAULT_QUALITY):
    if quality == "original":
        return f
    max_side, jpeg_q = PRESETS.get(quality, PRESETS[DEFAULT_QUALITY])
    name = (getattr(f, "name", "") or "").lower()
    if not name.endswith((".jpg", ".jpeg", ".png")):
        return f
    try:
        f.seek(0)
        img = Image.open(f)
        img.load()
    except Exception:
        f.seek(0)
        return f  # validator o'zi xato beradi
    img = ImageOps.exif_transpose(img)
    if max(img.size) > max_side:
        img.thumbnail((max_side, max_side), Image.LANCZOS)
    has_alpha = img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info)
    buf = io.BytesIO()
    base = os.path.splitext(os.path.basename(f.name))[0]
    if name.endswith(".png") and has_alpha:
        img.convert("RGBA").save(buf, "PNG", optimize=True)
        out_name, ctype = f"{base}.png", "image/png"
    else:
        img.convert("RGB").save(buf, "JPEG", quality=jpeg_q, optimize=True, progressive=True, subsampling=0 if jpeg_q >= 85 else 2)
        out_name, ctype = f"{base}.jpg", "image/jpeg"
    size = buf.tell()
    buf.seek(0)
    return InMemoryUploadedFile(buf, getattr(f, "field_name", None), out_name, ctype, size, None)
