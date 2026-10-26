"""Hujjat yuklashni tekshirish: kengaytma, hajm, haqiqiy fayl turi, virus skaneri, faol kontent, til, rasm optimallashtirish."""
from django.db.models import Sum
from PIL import Image
from rest_framework.exceptions import ValidationError

from apps.core.images import optimize_upload

from . import security

MAX_FILE_MB = 10
MAX_DOCS = 30
MAX_TOTAL_MB = 100
ALLOWED = {".pdf", ".jpg", ".jpeg", ".png", ".webp", ".docx"}  # eski .doc (makros yashirishi oson) qabul qilinmaydi
IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp"}
MAX_PIXELS = 50_000_000
MAGIC = {
    ".pdf": [b"%PDF"],
    ".docx": [b"PK\x03\x04"],
}


def check_and_prepare(application, upload, doc_type=""):
    """Faylni tekshiradi va (rasm bo'lsa) optimallashtirib qaytaradi."""
    name = (upload.name or "").lower()
    ext = "." + name.rsplit(".", 1)[-1] if "." in name else ""
    if ext not in ALLOWED:
        raise ValidationError({"file": "Ruxsat etilgan turlar: PDF, JPG, PNG, WEBP, DOCX."})
    if upload.size > MAX_FILE_MB * 1024 * 1024:
        raise ValidationError({"file": f"Bitta fayl {MAX_FILE_MB} MB dan oşmasligi kerak."})
    head = upload.read(8)
    upload.seek(0)
    if ext in MAGIC and not any(head.startswith(m) for m in MAGIC[ext]):
        raise ValidationError({"file": "Fayl mazmuni kengaytmasiga mos emas."})
    docs = application.documents.all()
    if docs.count() >= MAX_DOCS:
        raise ValidationError({"file": f"Bitta arizaga eng köpi bilan {MAX_DOCS} ta fayl yuklaş mumkin."})
    total = docs.aggregate(s=Sum("size"))["s"] or 0
    if total + upload.size > MAX_TOTAL_MB * 1024 * 1024:
        raise ValidationError({"file": f"Fayllarning umumiy hajmi {MAX_TOTAL_MB} MB dan oşmasligi kerak."})

    if doc_type == "motivation" and ext in IMAGE_EXT:
        raise ValidationError({"file": "Motivatsion xat matnli PDF yoki DOCX bölişi kerak (yapon tilida) — rasm qabul qilinmaydi."})

    # 1) virus skaneri (asl fayl, hech narsa o'zgartirilmasdan)
    scan = security.clamav_scan(upload)
    upload.seek(0)

    # 2) faol kontent va (kerak bo'lsa) matn
    text = ""
    if ext == ".pdf":
        text = security.inspect_pdf(upload.read())
    elif ext == ".docx":
        text = security.inspect_docx(upload.read())
    upload.seek(0)

    # 3) motivatsion xat yapon tilida bo'lishi shart
    lang_checked = False
    if doc_type == "motivation":
        lang_checked = security.ensure_japanese(text)

    if ext in IMAGE_EXT:
        try:
            img = Image.open(upload)
            if img.format not in {"JPEG", "PNG", "WEBP"} or img.width * img.height > MAX_PIXELS:
                raise ValueError
            img.verify()
        except Exception:
            raise ValidationError({"file": "Rasm fayli buzilgan yoki notöğri."})
        upload.seek(0)
        upload = optimize_upload(upload, "high")
    upload.scan_status = scan
    upload.lang_checked = lang_checked
    return upload
