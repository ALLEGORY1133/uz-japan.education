from django.core.exceptions import ValidationError
from django.db import models

from apps.core.validators import (
    image_extensions,
    media_extensions,
    validate_image_size,
    validate_media_size,
)


class University(models.Model):
    class Country(models.TextChoices):
        UZ = "uz", "Özbekiston"
        JP = "jp", "Yaponiya"

    class AdmissionStatus(models.TextChoices):
        OPEN = "open", "Qabul oçiq"
        SOON = "soon", "Tez orada"
        CLOSED = "closed", "Qabul yopiq"

    class ApplyMode(models.TextChoices):
        PLATFORM = "platform", "UzJapan platformasi orqali"
        EXTERNAL = "external", "Universitet sayti orqali"

    slug = models.SlugField(unique=True)
    country = models.CharField(max_length=2, choices=Country.choices)
    city = models.CharField(max_length=120, blank=True)  # tarjima
    name = models.CharField(max_length=250)  # tarjima
    short_name = models.CharField(max_length=40, blank=True)
    native_name = models.CharField(max_length=200, blank=True, help_text="Masalan: 京都大学")
    description = models.TextField(blank=True)  # tarjima

    logo = models.ImageField(
        upload_to="universities/logos/", blank=True,
        validators=[image_extensions, validate_image_size],
    )
    banner = models.ImageField(
        upload_to="universities/banners/", blank=True,
        validators=[image_extensions, validate_image_size],
    )
    brand_color = models.CharField(max_length=7, default="#14183F", help_text="Logotip yöq bölsa monogram foni")

    website_url = models.URLField(blank=True)
    admission_url = models.URLField("Qabul bölimi sahifasi", blank=True)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=40, blank=True)

    instruction_language = models.CharField(max_length=120, blank=True)  # tarjima
    admission_status = models.CharField(
        max_length=10, choices=AdmissionStatus.choices, default=AdmissionStatus.OPEN
    )
    has_bachelor = models.BooleanField(default=True)
    has_master = models.BooleanField(default=True)
    has_doctoral = models.BooleanField(default=False)

    apply_mode = models.CharField(max_length=10, choices=ApplyMode.choices, default=ApplyMode.PLATFORM)
    apply_url = models.URLField("Taşqi ariza havolasi", blank=True)

    application_start = models.DateField(null=True, blank=True)
    application_deadline = models.DateField(null=True, blank=True)
    results_date = models.DateField(null=True, blank=True)
    term_start = models.DateField(null=True, blank=True)

    contract_fee = models.CharField(max_length=200, blank=True)  # tarjima
    payment_terms = models.CharField(max_length=300, blank=True)  # tarjima
    living_cost = models.CharField(max_length=200, blank=True)  # tarjima
    grant_name = models.CharField(max_length=200, blank=True)  # tarjima
    grant_coverage = models.TextField(blank=True)  # tarjima
    grant_criteria = models.TextField(blank=True)  # tarjima

    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    sort_order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["country", "sort_order", "id"]
        verbose_name = "Universitet"
        verbose_name_plural = "Universitetlar"

    def __str__(self):
        return self.name or self.slug


class Requirement(models.Model):
    university = models.ForeignKey(University, on_delete=models.CASCADE, related_name="requirements")
    title = models.CharField(max_length=250)  # tarjima
    detail = models.CharField(max_length=500, blank=True)  # tarjima
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]
        verbose_name = "Qabul talabi"
        verbose_name_plural = "Qabul talablari"

    def __str__(self):
        return self.title


class Program(models.Model):
    class Level(models.TextChoices):
        BACHELOR = "bachelor", "Bakalavr"
        MASTER = "master", "Magistratura"
        DOCTORAL = "doctoral", "Doktorantura"

    university = models.ForeignKey(University, on_delete=models.CASCADE, related_name="programs")
    level = models.CharField(max_length=10, choices=Level.choices)
    name = models.CharField(max_length=250)  # tarjima
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["level", "sort_order", "id"]
        verbose_name = "Ta’lim yönalişi"
        verbose_name_plural = "Ta’lim yönalişlari"

    def __str__(self):
        return self.name


class UniversityMedia(models.Model):
    """Universitet sahifasi galereyasi: rasm va videolar (tartib bilan)."""

    class Kind(models.TextChoices):
        IMAGE = "image", "Rasm"
        VIDEO = "video", "Video"

    class Slot(models.TextChoices):
        GALLERY = "gallery", "Galereya"
        CAMPUS_VIDEO = "campus_video", "Kampus videosi (asosiy)"

    university = models.ForeignKey(University, on_delete=models.CASCADE, related_name="media")
    kind = models.CharField(max_length=5, choices=Kind.choices, default=Kind.IMAGE)
    slot = models.CharField(max_length=20, choices=Slot.choices, default=Slot.GALLERY)
    file = models.FileField(
        upload_to="universities/media/", blank=True,
        validators=[media_extensions, validate_media_size],
    )
    video_url = models.URLField(blank=True, help_text="YouTube yoki Vimeo havolasi")
    caption = models.CharField(max_length=200, blank=True)  # tarjima
    sort_order = models.PositiveIntegerField(default=0)
    is_visible = models.BooleanField(default=True)

    class Meta:
        ordering = ["sort_order", "id"]
        verbose_name = "Universitet media"
        verbose_name_plural = "Universitet media fayllari"

    def clean(self):
        if self.kind == self.Kind.IMAGE and not self.file:
            raise ValidationError({"file": "Rasm uçun fayl yuklang."})
        if self.kind == self.Kind.VIDEO and not (self.file or self.video_url):
            raise ValidationError({"video_url": "Video fayl yoki havola kiriting."})

    def __str__(self):
        return f"{self.university_id}:{self.kind}:{self.sort_order}"


class UsefulLink(models.Model):
    """Foydali havola. university bo'sh bo'lsa — butun sayt uchun (bosh sahifa)."""

    class Icon(models.TextChoices):
        SCHOLARSHIP = "scholarship", "Stipendiya"
        LANGUAGE = "language", "Til"
        VISA = "visa", "Viza va hujjatlar"
        HOUSING = "housing", "Yaşaş joyi"
        OTHER = "other", "Boşqa"

    university = models.ForeignKey(
        University, null=True, blank=True, on_delete=models.CASCADE, related_name="links"
    )
    title = models.CharField(max_length=200)  # tarjima
    description = models.CharField(max_length=300, blank=True)  # tarjima
    url = models.CharField(max_length=500, help_text="https://... yoki /sahifa")
    is_external = models.BooleanField(default=True)
    icon = models.CharField(max_length=12, choices=Icon.choices, default=Icon.OTHER)
    sort_order = models.PositiveIntegerField(default=0)
    is_visible = models.BooleanField(default=True)

    class Meta:
        ordering = ["sort_order", "id"]
        verbose_name = "Foydali havola"
        verbose_name_plural = "Foydali havolalar"

    def __str__(self):
        return self.title
