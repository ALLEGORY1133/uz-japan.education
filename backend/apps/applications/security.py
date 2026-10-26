"""Yuklangan hujjatlarni xavfsizlik va til bo'yicha tekshirish.

1. ClamAV (clamd) orqali virus skaneri — docker-compose dagi `clamav` xizmati.
2. Faol kontent: PDF (JavaScript, Launch, OpenAction, biriktirilgan fayllar...), DOCX (makros, ActiveX,
   OLE, tashqi shablon), zip-bomba.
3. Motivatsion xat: matn ajratib olinadi va yapon tilida ekanligi aniqlanadi.
"""
import logging
import re
import socket
import struct
import zipfile
from io import BytesIO

from django.conf import settings
from rest_framework.exceptions import ValidationError

log = logging.getLogger(__name__)

MAX_ZIP_ENTRIES = 2000
MAX_UNZIPPED_MB = 100
MAX_TEXT_CHARS = 200_000

PDF_BAD = re.compile(
    rb"/(JavaScript|JS|Launch|EmbeddedFile|EmbeddedFiles|OpenAction|AA|RichMedia|XFA|SubmitForm|ImportData|GoToR|GoToE)(?![A-Za-z0-9])"
)
BAD_ZIP_EXT = (".exe", ".dll", ".js", ".vbs", ".bat", ".cmd", ".ps1", ".scr", ".jar", ".com", ".msi", ".lnk", ".hta")
BAD_REL = re.compile(rb'Type="[^"]*/(attachedTemplate|oleObject|frame|subDocument|externalLinkPath)"[^>]*TargetMode="External"|TargetMode="External"[^>]*Type="[^"]*/(attachedTemplate|oleObject|frame|subDocument)"')


def _bad(msg):
    return ValidationError({"file": msg})


# ------------------------------------------------------------------ ClamAV

def clamav_scan(fileobj):
    """Faylni clamd ga yuboradi. Qaytaradi: "clean" yoki "skipped". Virus topilsa — ValidationError."""
    host = getattr(settings, "CLAMAV_HOST", "")
    if not host:
        return "skipped"
    required = getattr(settings, "CLAMAV_REQUIRED", True)
    port = int(getattr(settings, "CLAMAV_PORT", 3310))
    timeout = float(getattr(settings, "CLAMAV_TIMEOUT", 25))
    try:
        fileobj.seek(0)
        with socket.create_connection((host, port), timeout=timeout) as s:
            s.settimeout(timeout)
            s.sendall(b"zINSTREAM\0")
            while True:
                chunk = fileobj.read(64 * 1024)
                if not chunk:
                    break
                s.sendall(struct.pack("!I", len(chunk)) + chunk)
            s.sendall(struct.pack("!I", 0))
            resp = b""
            while not resp.endswith(b"\0"):
                part = s.recv(4096)
                if not part:
                    break
                resp += part
        fileobj.seek(0)
        text = resp.strip(b"\0 \n").decode("utf-8", "ignore")
    except OSError as e:
        log.error("ClamAV bilan ulanib bölmadi: %s", e)
        if required:
            raise _bad("Xavfsizlik tekşiruvi vaqtinça işlamayapti. Birozdan söng qayta urinib köring.")
        return "skipped"
    if text.endswith("OK"):
        return "clean"
    if "FOUND" in text:
        log.warning("Virus topildi: %s", text)
        raise _bad("Fayl xavfli (virus) deb topildi va rad etildi.")
    log.error("ClamAV kutilmagan javob: %r", text)
    if required:
        raise _bad("Xavfsizlik tekşiruvi vaqtinça işlamayapti. Birozdan söng qayta urinib köring.")
    return "skipped"


# ------------------------------------------------------------------ PDF

def _norm_pdf_names(data: bytes) -> bytes:
    """/Java#53cript kabi yashirilgan nomlarni ochadi."""
    return re.sub(rb"#([0-9A-Fa-f]{2})", lambda m: bytes([int(m.group(1), 16)]), data)


def inspect_pdf(data: bytes):
    """PDF faol kontent (skript, avtoishga tushish, biriktirma) saqlamasligini tekshiradi. Matn qaytaradi."""
    if PDF_BAD.search(_norm_pdf_names(data)):
        raise _bad("PDF içida faol kontent (skript yoki biriktirilgan fayl) bor — bunday fayl qabul qilinmaydi.")
    try:
        from pypdf import PdfReader

        reader = PdfReader(BytesIO(data))
        if reader.is_encrypted:
            raise _bad("Parol bilan himoyalangan PDF qabul qilinmaydi.")
        root = reader.trailer["/Root"]
        for key in ("/OpenAction", "/AA", "/Names", "/AcroForm"):
            if key == "/Names":
                names = root.get("/Names")
                if names is not None and any(k in names.get_object() for k in ("/JavaScript", "/EmbeddedFiles")):
                    raise _bad("PDF içida faol kontent bor — bunday fayl qabul qilinmaydi.")
            elif key == "/AcroForm":
                af = root.get("/AcroForm")
                if af is not None and "/XFA" in af.get_object():
                    raise _bad("PDF içida faol kontent bor — bunday fayl qabul qilinmaydi.")
            elif key in root:
                raise _bad("PDF içida avtomatik harakat bor — bunday fayl qabul qilinmaydi.")
        parts = []
        for i, page in enumerate(reader.pages):
            if "/AA" in page:
                raise _bad("PDF içida avtomatik harakat bor — bunday fayl qabul qilinmaydi.")
            if i < 25:
                parts.append(page.extract_text() or "")
        return "\n".join(parts)[:MAX_TEXT_CHARS]
    except ValidationError:
        raise
    except Exception:
        raise _bad("PDF fayl buzilgan yoki öqib bölmadi.")


# ------------------------------------------------------------------ DOCX

def inspect_docx(data: bytes):
    """DOCX: makros, ActiveX, OLE, tashqi shablon va zip-bomba yo'qligini tekshiradi. Matn qaytaradi."""
    try:
        z = zipfile.ZipFile(BytesIO(data))
    except zipfile.BadZipFile:
        raise _bad("DOCX fayl buzilgan.")
    infos = z.infolist()
    if len(infos) > MAX_ZIP_ENTRIES or sum(i.file_size for i in infos) > MAX_UNZIPPED_MB * 1024 * 1024:
        raise _bad("Fayl juda katta oçiladi (zip-bomba xavfi) — qabul qilinmaydi.")
    names = [i.filename for i in infos]
    low = [n.lower() for n in names]
    if "word/document.xml" not in low:
        raise _bad("Bu haqiqiy DOCX hujjat emas.")
    for n in low:
        if (
            "vbaproject" in n or n.startswith("word/activex") or n.startswith("word/embeddings/")
            or n.endswith(".bin") or n.endswith(BAD_ZIP_EXT)
        ):
            raise _bad("Hujjat içida makros yoki işga tuşuvçi element bor — qabul qilinmaydi.")
    for i in infos:
        if i.filename.lower() == "[content_types].xml":
            if b"macroEnabled" in z.read(i):
                raise _bad("Makroli hujjat qabul qilinmaydi.")
        if i.filename.lower().endswith(".rels") and BAD_REL.search(z.read(i)):
            raise _bad("Hujjatda taşqi şablon yoki ob’ekt havolasi bor — qabul qilinmaydi.")
    xml = z.read("word/document.xml").decode("utf-8", "ignore")
    text = " ".join(re.findall(r"<w:t[^>]*>([^<]*)</w:t>", xml))
    return text[:MAX_TEXT_CHARS]


# ------------------------------------------------------------------ til

def japanese_stats(text: str):
    letters = jp = kana = 0
    for ch in text:
        o = ord(ch)
        if 0x3040 <= o <= 0x30FF or 0x31F0 <= o <= 0x31FF or 0xFF66 <= o <= 0xFF9F:  # hiragana/katakana
            letters += 1; jp += 1; kana += 1
        elif 0x4E00 <= o <= 0x9FFF or 0x3400 <= o <= 0x4DBF:  # kanji
            letters += 1; jp += 1
        elif ch.isalpha():
            letters += 1
    return letters, jp, kana


def ensure_japanese(text: str):
    """Motivatsion xat yapon tilida yozilganini tekshiradi (kamida ~100 belgi, asosiy qismi yapon yozuvi)."""
    letters, jp, kana = japanese_stats(text or "")
    if letters == 0:
        raise _bad("Hujjatdan matn topilmadi (skaner qilingan rasm bölişi mumkin). Matnli PDF yoki DOCX yuklang.")
    if letters < 100:
        raise _bad("Motivatsion xat juda qisqa. Yapon tilida töliq xat yuklang.")
    if jp / letters < 0.6 or kana < 30 or kana / max(jp, 1) < 0.12:
        raise _bad("Motivatsion xat yapon tilida yozilişi kerak. Fayl matni yapon tilida emas deb topildi.")
    return True
