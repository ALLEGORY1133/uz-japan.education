import os
import secrets
import uuid

from django.conf import settings
from django.core.files.storage import FileSystemStorage
from django.db import models


def get_private_storage():
    """Hujjatlar uchun yopiq xotira (ommaviy URL yo'q): faqat admin API orqali beriladi."""
    return FileSystemStorage(location=str(settings.PRIVATE_ROOT), base_url=None)


def new_tracking_code():
    return "UJ-" + secrets.token_hex(5).upper()


class Application(models.Model):
    """Talabaning universitetga arizasi. Ro'yxatdan o'tish talab qilinmaydi: kuzatuv kodi + email."""

    class Status(models.TextChoices):
        NEW = "new", "Yangi"
        REVIEWING = "reviewing", "Körib çiqilmoqda"
        ACCEPTED = "accepted", "Qabul qilindi"
        REJECTED = "rejected", "Rad etildi"

    class Degree(models.TextChoices):
        BACHELOR = "bachelor", "Bakalavr"
        MASTER = "master", "Magistratura"
        DOCTORAL = "doctoral", "Doktorantura"

    class Funding(models.TextChoices):
        CONTRACT = "contract", "Kontrakt"
        GRANT = "grant", "Grant"

    university = models.ForeignKey("universities.University", on_delete=models.CASCADE, related_name="applications")
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=40)
    degree = models.CharField(max_length=10, choices=Degree.choices)
    funding = models.CharField(max_length=10, choices=Funding.choices)
    message = models.TextField(blank=True, max_length=3000)

    # Qo'shimcha anketa
    middle_name = models.CharField(max_length=100, blank=True)
    id_series = models.CharField(max_length=20, blank=True, help_text="Şaxsni tasdiqlovçi hujjat seriyasi")
    birth_date = models.DateField(null=True, blank=True)
    citizenship = models.CharField(max_length=80, blank=True)
    city = models.CharField(max_length=100, blank=True)
    passport_number = models.CharField(max_length=40, blank=True)
    program = models.CharField(max_length=200, blank=True, help_text="Qiziqqan yönaliş")

    # Kuzatuv kodi: talaba hujjat qo'shishi va holatni ko'rishi uchun
    tracking_code = models.CharField(max_length=16, unique=True, null=True, blank=True, editable=False)
    # Hujjatlar yuklanib bo'lgach "yuborish" bosiladi; shundan keyin universitetga ko'rinadi
    is_submitted = models.BooleanField(default=True)
    submitted_at = models.DateTimeField(null=True, blank=True)

    status = models.CharField(max_length=10, choices=Status.choices, default=Status.NEW)
    internal_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Ariza"
        verbose_name_plural = "Arizalar"

    def save(self, *args, **kwargs):
        if not self.tracking_code:
            code = new_tracking_code()
            while Application.objects.filter(tracking_code=code).exists():
                code = new_tracking_code()
            self.tracking_code = code
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.first_name} {self.last_name} → {self.university_id}"


def document_path(instance, filename):
    ext = os.path.splitext(filename)[1].lower()[:8]
    return f"{instance.application.tracking_code or instance.application_id}/{uuid.uuid4().hex}{ext}"


class ApplicationDocument(models.Model):
    """Arizaga biriktirilgan hujjat. Fayl diskda (yopiq papkada), bazada faqat qisqa ma'lumot."""

    class Type(models.TextChoices):
        PASSPORT = "passport", "Şaxsni tasdiqlovçi hujjat"
        DIPLOMA = "diploma", "Diplom / attestat"
        TRANSCRIPT = "transcript", "Transkript"
        LANGUAGE = "language_cert", "Til sertifikati"
        CV = "cv", "Tarjimai hol (CV)"
        MOTIVATION = "motivation", "Motivatsion xat"
        RECOMMENDATION = "recommendation", "Tavsiyanoma"
        PHOTO = "photo", "Foto"
        OTHER = "other", "Boşqa"

    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name="documents")
    doc_type = models.CharField(max_length=20, choices=Type.choices, default=Type.OTHER)
    file = models.FileField(upload_to=document_path, storage=get_private_storage, max_length=200)
    original_name = models.CharField(max_length=200)
    # Avtomatik tekshiruv natijalari
    scan_status = models.CharField(max_length=12, default="skipped", help_text="clean — ClamAV toza deb topdi; skipped — skaner öçiq edi")
    lang_checked = models.BooleanField(default=False, help_text="Motivatsion xat yapon tilida ekani tasdiqlangan")
    size = models.PositiveIntegerField(default=0)
    content_type = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["doc_type", "id"]
        verbose_name = "Ariza hujjati"
        verbose_name_plural = "Ariza hujjatlari"

    def __str__(self):
        return f"{self.application_id}:{self.doc_type}:{self.original_name}"


from django.db.models.signals import post_delete  # noqa: E402
from django.dispatch import receiver  # noqa: E402


@receiver(post_delete, sender=ApplicationDocument)
def _delete_document_file(sender, instance, **kwargs):
    """Yozuv o'chsa — fayl ham diskdan o'chadi (ariza o'chganda ham)."""
    if instance.file:
        instance.file.delete(save=False)


class Inquiry(models.Model):
    """Bosh sahifadagi "Savollaringiz bormi?" formasidan kelgan murojaat."""

    class Interest(models.TextChoices):
        BACHELOR = "bachelor", "Bakalavr"
        MASTER = "master", "Magistratura"
        DOCTORAL = "doctoral", "Doktorantura"
        GRANT = "grant", "Grant / stipendiya"
        EXCHANGE = "exchange", "Almaşinuv dasturi"
        OTHER = "other", "Boşqa"

    name = models.CharField("Ism", max_length=120)
    email = models.EmailField("Email")
    phone = models.CharField("Telefon", max_length=40, blank=True)
    interest = models.CharField("Qiziqiş yönalişi", max_length=12, choices=Interest.choices, default=Interest.OTHER)
    message = models.TextField("Xabar", blank=True, max_length=2000)
    is_handled = models.BooleanField("Körib çiqildi", default=False)
    reply = models.TextField("Admin javobi", blank=True, max_length=4000)
    replied_at = models.DateTimeField("Javob vaqti", null=True, blank=True)
    replied_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        verbose_name = "Murojaat"
        verbose_name_plural = "Murojaatlar"

    def __str__(self):
        return f"{self.name} <{self.email}>"
