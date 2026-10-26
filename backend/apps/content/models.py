from django.db import models
from django.utils import timezone
from django.utils.text import slugify

from apps.core.validators import (
    media_extensions,
    validate_media_size,
    image_extensions,
    validate_image_size,
    validate_video_size,
    video_extensions,
)


class MediaKind(models.TextChoices):
    NONE = "none", "Rasmsiz"
    IMAGE = "image", "Rasm"
    VIDEO = "video", "Video"


class HeroSlide(models.Model):
    """Bosh sahifa slayderi. Slaydlar sort_order bo'yicha almashadi."""

    class Theme(models.TextChoices):
        SUNSET = "sunset", "Quyoş botişi (Yaponiya)"
        TEAL = "teal", "Firuza (Özbekiston)"
        VIOLET = "violet", "Binafşa (Almaşinuv)"

    eyebrow = models.CharField(max_length=100, blank=True)  # tarjima
    title = models.CharField(max_length=200)  # tarjima
    highlight = models.CharField(max_length=80, blank=True, help_text="Sarlavhadagi rangli söz")  # tarjima
    description = models.TextField(blank=True)  # tarjima
    primary_label = models.CharField(max_length=80, blank=True)  # tarjima
    primary_url = models.CharField(max_length=300, blank=True)
    secondary_label = models.CharField(max_length=80, blank=True)  # tarjima
    secondary_url = models.CharField(max_length=300, blank=True)
    theme = models.CharField(max_length=10, choices=Theme.choices, default=Theme.SUNSET)

    media_kind = models.CharField(max_length=5, choices=MediaKind.choices, default=MediaKind.NONE)
    image = models.ImageField(
        upload_to="hero/", blank=True, validators=[image_extensions, validate_image_size]
    )
    video = models.FileField(
        upload_to="hero/", blank=True, validators=[video_extensions, validate_video_size]
    )
    video_url = models.URLField(blank=True, help_text="YouTube yoki Vimeo havolasi")

    sort_order = models.PositiveIntegerField(default=0)
    is_visible = models.BooleanField(default=True)

    class Meta:
        ordering = ["sort_order", "id"]
        verbose_name = "Slayd"
        verbose_name_plural = "Boş sahifa slaydlari"

    def __str__(self):
        return self.title


class HeroSlideImage(models.Model):
    """Slaydga qo'shimcha rasmlar: asosiy rasm bilan birga yumshoq almashib turadi."""

    slide = models.ForeignKey(HeroSlide, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="hero/", validators=[image_extensions, validate_image_size])
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]
        verbose_name = "Slayd qöşimça rasmi"
        verbose_name_plural = "Slayd qöşimça rasmlari"

    def __str__(self):
        return f"{self.slide_id}:{self.sort_order}"


class SiteMedia(models.Model):
    """Saytdagi qat'iy joylar uchun rasm/video (har bir joy — bitta yozuv)."""

    class Key(models.TextChoices):
        STUDENTS_CARD = "students_card", "Talabalar kartasi"
        COLLAB_CARD = "collab_card", "Hamkorlik kartasi"
        ONLINE_VIDEO = "online_video", "Onlayn hamkorlik videosi"

    key = models.CharField(max_length=30, choices=Key.choices, unique=True)
    kind = models.CharField(max_length=5, choices=MediaKind.choices, default=MediaKind.IMAGE)
    image = models.ImageField(upload_to="site/", blank=True, validators=[image_extensions, validate_image_size])
    video = models.FileField(upload_to="site/", blank=True, validators=[video_extensions, validate_video_size])
    video_url = models.URLField(blank=True)
    caption = models.CharField(max_length=200, blank=True)  # tarjima

    class Meta:
        verbose_name = "Sayt media"
        verbose_name_plural = "Sayt media fayllari"

    def __str__(self):
        return self.get_key_display()


class News(models.Model):
    class Category(models.TextChoices):
        NEWS = "news", "Yangilik"
        COOPERATION = "cooperation", "Hamkorlik"
        EVENT = "event", "Tadbir"

    class LinkType(models.TextChoices):
        INTERNAL = "internal", "Içki sahifa"
        EXTERNAL = "external", "Taşqi manba"

    slug = models.SlugField(unique=True, blank=True, max_length=120)
    title = models.CharField(max_length=250)  # tarjima
    summary = models.CharField(max_length=400, blank=True)  # tarjima
    body = models.TextField(blank=True)  # tarjima
    category = models.CharField(max_length=12, choices=Category.choices, default=Category.NEWS)
    cover = models.ImageField(upload_to="news/", blank=True, validators=[image_extensions, validate_image_size])
    link_type = models.CharField(max_length=10, choices=LinkType.choices, default=LinkType.INTERNAL)
    external_url = models.URLField(blank=True, help_text="Taşqi manba yoki tadbirga ulaniş havolasi")
    source_name = models.CharField(max_length=120, blank=True)
    published_at = models.DateTimeField(default=timezone.now)
    event_starts_at = models.DateTimeField(null=True, blank=True)
    event_location = models.CharField(max_length=200, blank=True)  # tarjima
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ["-published_at", "-id"]
        verbose_name = "Yangilik"
        verbose_name_plural = "Yangiliklar"

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title_en or "") or slugify(self.title_uz or "") or "news"
            base = base[:100]
            slug, i = base, 2
            while News.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{i}"
                i += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class NewsMedia(models.Model):
    """Yangilik/tadbir galereyasi: bir nechta rasm va video."""

    news = models.ForeignKey(News, on_delete=models.CASCADE, related_name="media")
    kind = models.CharField(max_length=5, choices=[("image", "Rasm"), ("video", "Video")], default="image")
    file = models.FileField(upload_to="news/gallery/", blank=True, validators=[media_extensions, validate_media_size])
    video_url = models.URLField(blank=True, help_text="YouTube yoki Vimeo havolasi")
    caption = models.CharField(max_length=200, blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]
        verbose_name = "Yangilik media"
        verbose_name_plural = "Yangilik media fayllari"

    def __str__(self):
        return f"{self.news_id}:{self.kind}:{self.sort_order}"


class Stat(models.Model):
    label = models.CharField(max_length=120)  # tarjima
    value = models.PositiveIntegerField()
    suffix = models.CharField(max_length=4, blank=True, default="+")
    sort_order = models.PositiveIntegerField(default=0)
    is_visible = models.BooleanField(default=True)

    class Meta:
        ordering = ["sort_order", "id"]
        verbose_name = "Statistika"
        verbose_name_plural = "Statistika"

    def __str__(self):
        return f"{self.value}{self.suffix} {self.label}"


class SiteSettings(models.Model):
    """Yagona yozuv (pk=1): aloqa va ijtimoiy tarmoqlar."""

    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=40, blank=True)
    address = models.CharField(max_length=250, blank=True)  # tarjima
    telegram_url = models.URLField(blank=True)
    youtube_url = models.URLField(blank=True)
    linkedin_url = models.URLField(blank=True)
    instagram_url = models.URLField(blank=True)

    class Meta:
        verbose_name = "Sayt sozlamalari"
        verbose_name_plural = "Sayt sozlamalari"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return "Sayt sozlamalari"
