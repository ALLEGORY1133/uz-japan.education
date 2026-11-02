import apps.core.validators
import django.core.validators
from django.db import migrations, models

IMG = [django.core.validators.FileExtensionValidator(["jpg", "jpeg", "png", "webp", "avif"]), apps.core.validators.validate_image_size]
VID = [django.core.validators.FileExtensionValidator(["mp4", "webm"]), apps.core.validators.validate_video_size]


class Migration(migrations.Migration):
    dependencies = [("content", "0012_sitesettings_map_query")]

    operations = [
        migrations.CreateModel(
            name="AboutItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("kind", models.CharField(choices=[("history", "Tarix"), ("achievement", "Yutuq"), ("analysis", "Tahlil")], db_index=True, default="achievement", max_length=12)),
                ("title", models.CharField(max_length=250)),
                ("title_uz", models.CharField(max_length=250, null=True)),
                ("title_ja", models.CharField(max_length=250, null=True)),
                ("title_en", models.CharField(max_length=250, null=True)),
                ("summary", models.CharField(blank=True, max_length=400)),
                ("summary_uz", models.CharField(blank=True, max_length=400, null=True)),
                ("summary_ja", models.CharField(blank=True, max_length=400, null=True)),
                ("summary_en", models.CharField(blank=True, max_length=400, null=True)),
                ("body", models.TextField(blank=True)),
                ("body_uz", models.TextField(blank=True, null=True)),
                ("body_ja", models.TextField(blank=True, null=True)),
                ("body_en", models.TextField(blank=True, null=True)),
                ("year", models.PositiveSmallIntegerField(blank=True, help_text="Yil (tarix va yutuqlar uchun)", null=True)),
                ("image", models.ImageField(blank=True, upload_to="about/", validators=IMG)),
                ("video", models.FileField(blank=True, upload_to="about/", validators=VID)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("is_visible", models.BooleanField(default=True)),
            ],
            options={
                "verbose_name": "Biz haqimizda yozuvi",
                "verbose_name_plural": "Biz haqimizda yozuvlari",
                "ordering": ["sort_order", "-year", "id"],
            },
        ),
    ]
